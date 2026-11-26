ALTER TABLE "refresh_tokens" ADD COLUMN "previous_token_hash" text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "rotated_at" timestamp with time zone;