# Avelis OpenTofu/Terraform Deployment Scaffold
# This demonstrates the isolated architecture:
# - API/Web application (Express + TanStack Start)
# - Ephemeral Room Service (WebSocket cluster)
# - PostgreSQL 16 (RDS)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Example VPC and isolated subnets
resource "aws_vpc" "avelis_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "avelis-vpc"
  }
}

# Example RDS Instance (Encrypted at rest for Ledger)
resource "aws_db_instance" "avelis_db" {
  identifier           = "avelis-ledger-db"
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = "db.t4g.micro"
  allocated_storage    = 20
  storage_encrypted    = true
  username             = "postgres"
  password             = var.db_password # Injected via CI/KMS
  skip_final_snapshot  = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

# The Room Service should be deployed on compute (ECS/Fargate)
# with autoscaling, but scaling a memory-only WebSocket server requires
# sticky sessions or Redis pub/sub if running multiple instances.
# For Avelis (L1), process crashes drop state, which is an acceptable/desired
# outcome for ephemeral rooms.
