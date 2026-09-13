# Avelis OpenTofu/Terraform Deployment Scaffold (Phase 3 + maturity-10 hardening)
# Valid HCL placeholders - expand before real apply.
# ECS/Fargate api + room, Secrets Manager, encrypted RDS, KMS keys.
# Room: sticky sessions or desired_count=1 until multi-instance fanout exists.
#
# Networking note: private subnets with assign_public_ip=false require either a NAT gateway
# or VPC endpoints (ECR, Secrets Manager, CloudWatch, KMS) before tasks can pull images / secrets.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "room_shared_secret" {
  type      = string
  sensitive = true
}

variable "project" {
  type    = string
  default = "avelis"
}

resource "aws_vpc" "avelis_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "avelis-vpc" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.avelis_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags              = { Name = "avelis-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.avelis_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags              = { Name = "avelis-private-b" }
}

resource "aws_kms_key" "data" {
  description             = "Avelis envelope encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = { Name = "avelis-data-key" }
}

resource "aws_kms_alias" "data" {
  name          = "alias/avelis-data"
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_kms_key" "signing" {
  description             = "Avelis ledger / destruction signing key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  # Real apply: key_usage = "SIGN_VERIFY", customer_master_key_spec = "RSA_2048"
  tags = { Name = "avelis-signing-key" }
}

resource "aws_kms_alias" "signing" {
  name          = "alias/avelis-signing"
  target_key_id = aws_kms_key.signing.key_id
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "avelis/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "room" {
  name = "avelis/room-shared-secret"
}

resource "aws_secretsmanager_secret_version" "room" {
  secret_id     = aws_secretsmanager_secret.room.id
  secret_string = var.room_shared_secret
}

resource "aws_secretsmanager_secret" "db_url" {
  name = "avelis/database-url"
}

resource "aws_db_subnet_group" "avelis" {
  name       = "avelis-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_instance" "avelis_db" {
  identifier              = "avelis-ledger-db"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t4g.micro"
  allocated_storage       = 20
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.data.arn
  username                = "avelis"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.avelis.name
  skip_final_snapshot     = true
  backup_retention_period = 7
  tags                    = { Name = "avelis-rds" }
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = format("postgresql://avelis:%s@%s:5432/postgres", var.db_password, aws_db_instance.avelis_db.address)
}

resource "aws_ecs_cluster" "avelis" {
  name = "avelis-cluster"
}

resource "aws_iam_role" "ecs_execution" {
  name = "avelis-ecs-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "avelis-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.jwt.arn,
        aws_secretsmanager_secret.room.arn,
        aws_secretsmanager_secret.db_url.arn
      ]
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "avelis-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_kms" {
  name = "avelis-ecs-task-kms"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:Sign",
        "kms:Verify",
        "kms:DescribeKey"
      ]
      Resource = [
        aws_kms_key.data.arn,
        aws_kms_key.signing.arn
      ]
    }]
  })
}

resource "aws_ecs_task_definition" "api" {
  family                   = "avelis-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name         = "api"
    image        = "REPLACE_WITH_API_IMAGE"
    essential    = true
    portMappings = [{ containerPort = 3001, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "KMS_PROVIDER", value = "aws" },
      { name = "TRUST_PROXY", value = "true" },
      { name = "LOG_REQUEST_BODIES", value = "false" },
      { name = "LOG_WEBSOCKET_PAYLOADS", value = "false" },
      { name = "SESSION_REPLAY_ENABLED", value = "false" },
      { name = "PRODUCT_ANALYTICS_ENABLED", value = "false" },
      { name = "AWS_KMS_KEY_ID", value = aws_kms_key.data.arn },
      { name = "AWS_KMS_SIGNING_KEY_ID", value = aws_kms_key.signing.arn },
      { name = "RETENTION_JOB_INTERVAL_MINUTES", value = "15" },
      { name = "SECURITY_AUDIT_RETENTION_HOURS", value = "720" }
    ]
    secrets = [
      { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt.arn },
      { name = "ROOM_SHARED_SECRET", valueFrom = aws_secretsmanager_secret.room.arn },
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.db_url.arn }
    ]
  }])
}

resource "aws_ecs_task_definition" "room" {
  family                   = "avelis-room"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name         = "room"
    image        = "REPLACE_WITH_ROOM_IMAGE"
    essential    = true
    portMappings = [{ containerPort = 3002, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "ROOM_SWAP_DISABLED", value = "true" },
      { name = "LOG_WEBSOCKET_PAYLOADS", value = "false" }
    ]
    secrets = [
      { name = "ROOM_SHARED_SECRET", valueFrom = aws_secretsmanager_secret.room.arn }
    ]
  }])
}

resource "aws_ecs_service" "api" {
  name            = "avelis-api"
  cluster         = aws_ecs_cluster.avelis.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "room" {
  name            = "avelis-room"
  cluster         = aws_ecs_cluster.avelis.id
  task_definition = aws_ecs_task_definition.room.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    assign_public_ip = false
  }
}

output "kms_data_key_arn" {
  value = aws_kms_key.data.arn
}

output "kms_signing_key_arn" {
  value = aws_kms_key.signing.arn
}

output "rds_endpoint" {
  value = aws_db_instance.avelis_db.address
}
