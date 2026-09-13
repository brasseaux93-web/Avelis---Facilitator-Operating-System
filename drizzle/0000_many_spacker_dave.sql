CREATE TYPE "public"."actor_kind" AS ENUM('facilitator', 'party', 'system');--> statement-breakpoint
CREATE TYPE "public"."agenda_item_status" AS ENUM('tabled', 'agreed', 'parked', 'refused');--> statement-breakpoint
CREATE TYPE "public"."attested_by_kind" AS ENUM('system', 'facilitator');--> statement-breakpoint
CREATE TYPE "public"."facilitator_status" AS ENUM('active', 'suspended', 'offboarded');--> statement-breakpoint
CREATE TYPE "public"."identity_class" AS ENUM('named', 'role_only', 'affiliation_only', 'unnamed');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'joined', 'declined', 'left', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."joint_minute_status" AS ENUM('draft', 'published', 'wiped');--> statement-breakpoint
CREATE TYPE "public"."ledger_line_type" AS ENUM('session_opened', 'session_closed', 'session_close_failed', 'room_destroyed', 'invite_created', 'invite_sent', 'invite_delivery_failed', 'invite_revoked', 'party_joined', 'party_declined', 'party_left', 'party_access_revoked', 'identity_class_set', 'identity_class_corrected', 'agenda_item_tabled', 'agenda_item_reordered', 'agenda_item_marked', 'caucus_opened', 'caucus_closed', 'caucus_access_changed', 'process_mark_recorded', 'ledger_line_published', 'ledger_line_withdrawn_from_party_view', 'joint_minute_created', 'joint_minute_published', 'joint_minute_initialed', 'joint_minute_exported', 'joint_minute_wiped', 'retention_window_set', 'purge_started', 'purge_completed', 'purge_failed', 'destruction_attested');--> statement-breakpoint
CREATE TYPE "public"."ledger_root_reason" AS ENUM('session_closed', 'pre_purge', 'destruction_attestation', 'integrity_checkpoint');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('draft', 'open', 'closed', 'purged');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('facilitator_ui', 'party_ui', 'application_server', 'room_server', 'retention_job', 'admin_correction');--> statement-breakpoint
CREATE TYPE "public"."initial_visibility" AS ENUM('facilitator_only', 'party_visible');--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL,
	"status" "agenda_item_status" DEFAULT 'tabled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destruction_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"purged_at" timestamp with time zone NOT NULL,
	"retention_window" text NOT NULL,
	"bodies_destroyed" text[] NOT NULL,
	"final_sequence_number" bigint NOT NULL,
	"ledger_root_hash" text NOT NULL,
	"destruction_manifest_digest" text NOT NULL,
	"attested_by_kind" "attested_by_kind" NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilitator_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"status" "facilitator_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facilitator_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "joint_minutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"content" text,
	"content_digest" text,
	"status" "joint_minute_status" DEFAULT 'draft' NOT NULL,
	"initialed_by" uuid[],
	"last_exported_at" timestamp with time zone,
	"wiped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sequence_number" bigint NOT NULL,
	"line_type" "ledger_line_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_digest" text NOT NULL,
	"actor_kind" "actor_kind" NOT NULL,
	"actor_ref" uuid,
	"source" "source" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	"schema_version" smallint NOT NULL,
	"initial_visibility" "initial_visibility" NOT NULL,
	"previous_line_hash" text,
	"line_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_roots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"last_sequence_number" bigint NOT NULL,
	"last_line_hash" text NOT NULL,
	"reason" "ledger_root_reason" NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signature_algorithm" text NOT NULL,
	"key_reference" text NOT NULL,
	"signature" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"encryption_key_id" text NOT NULL,
	"signing_key_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"identity_class" "identity_class" NOT NULL,
	"display_label" text NOT NULL,
	"delivery_address" text,
	"invite_code_hash" text,
	"invite_status" "invite_status" DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"facilitator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "session_status" DEFAULT 'draft' NOT NULL,
	"retention_hours" integer NOT NULL,
	"retention_expires_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitator_accounts" ADD CONSTRAINT "facilitator_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_minutes" ADD CONSTRAINT "joint_minutes_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_lines" ADD CONSTRAINT "ledger_lines_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_roots" ADD CONSTRAINT "ledger_roots_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_facilitator_id_facilitator_accounts_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."facilitator_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agenda_session_order" ON "agenda_items" USING btree ("session_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_destruction_receipt_session" ON "destruction_receipts" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ledger_session_sequence" ON "ledger_lines" USING btree ("session_id","sequence_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ledger_session_idempotency" ON "ledger_lines" USING btree ("session_id","idempotency_key") WHERE "ledger_lines"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_ledger_session_sequence_read" ON "ledger_lines" USING btree ("session_id","sequence_number");--> statement-breakpoint
CREATE INDEX "idx_ledger_roots_session" ON "ledger_roots" USING btree ("session_id","signed_at");--> statement-breakpoint
CREATE INDEX "idx_parties_session" ON "parties" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_facilitator_status" ON "sessions" USING btree ("facilitator_id","status");--> statement-breakpoint
CREATE INDEX "idx_sessions_org_status" ON "sessions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_sessions_retention_expiry" ON "sessions" USING btree ("retention_expires_at") WHERE "sessions"."status" = 'closed';