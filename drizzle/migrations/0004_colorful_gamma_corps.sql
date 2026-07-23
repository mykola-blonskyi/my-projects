CREATE TYPE "public"."user_locale" AS ENUM('en', 'ru', 'uk', 'es');--> statement-breakpoint
CREATE TYPE "public"."user_theme" AS ENUM('light', 'dark', 'theme-rose');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'en'::"public"."user_locale";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "locale" SET DATA TYPE "public"."user_locale" USING "locale"::"public"."user_locale";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "theme" SET DEFAULT 'light'::"public"."user_theme";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "theme" SET DATA TYPE "public"."user_theme" USING "theme"::"public"."user_theme";