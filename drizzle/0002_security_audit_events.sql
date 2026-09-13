CREATE TABLE IF NOT EXISTS "security_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid,
  "event_type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_security_audit_org_created" ON "security_audit_events" ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_security_audit_created" ON "security_audit_events" ("created_at");
