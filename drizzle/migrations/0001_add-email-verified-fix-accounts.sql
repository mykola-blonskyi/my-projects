ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "id";