CREATE TYPE "public"."price_unit" AS ENUM('fixed', 'per_day', 'per_hour', 'per_guest');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('vendor_listing', 'venue');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'moderator', 'support', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."otp_type" AS ENUM('email_verification', 'password_reset', 'two_factor', 'account_deletion');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'completed', 'disputed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('vendor', 'venue_provider');--> statement-breakpoint
CREATE TYPE "public"."review_direction" AS ENUM('organizer_to_provider', 'provider_to_organizer');--> statement-breakpoint
CREATE TYPE "public"."admin_log_target_type" AS ENUM('vendor_profile', 'venue_provider_profile', 'venue', 'vendor_listing', 'user', 'booking');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255),
	"google_auth_id" varchar(255),
	"name" varchar(30),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_auth_id_unique" UNIQUE("google_auth_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_token_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "otp_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "otp_type" NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "otp_records_attempts_check" CHECK ("otp_records"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "organizer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"state" varchar(50),
	"city" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(150) NOT NULL,
	"description" varchar(2000),
	"state" varchar(50),
	"city" varchar(50),
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bank_code" varchar(10),
	"account_number" varchar(20),
	"account_name" varchar(255),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "vendor_profiles_payouts_check" CHECK ("vendor_profiles"."payouts_enabled" = false OR "vendor_profiles"."verification_status" = 'approved')
);
--> statement-breakpoint
CREATE TABLE "venue_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(150) NOT NULL,
	"description" varchar(2000),
	"state" varchar(50),
	"city" varchar(50),
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bank_code" varchar(10),
	"account_number" varchar(20),
	"account_name" varchar(255),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venue_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "venue_provider_profiles_payouts_check" CHECK ("venue_profiles"."payouts_enabled" = false OR "venue_profiles"."verification_status" = 'approved')
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"applies_to" "target_type" NOT NULL,
	"description" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_profile_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2000),
	"price_min" bigint NOT NULL,
	"price_max" bigint NOT NULL,
	"price_unit" "price_unit" DEFAULT 'fixed' NOT NULL,
	"state" varchar(50),
	"city" varchar(50),
	"portfolio_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1600),
	"is_active" boolean DEFAULT true NOT NULL,
	"rating_avg" numeric(3, 2),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_listings_price_check" CHECK ("vendor_listings"."price_min" >= 0 AND "vendor_listings"."price_max" >= "vendor_listings"."price_min")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_profile_id" uuid NOT NULL,
	"venue_type_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(2000),
	"address" varchar(300) NOT NULL,
	"state" varchar(50),
	"city" varchar(50),
	"capacity_min" integer,
	"capacity_max" integer,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_min" bigint NOT NULL,
	"price_max" bigint NOT NULL,
	"price_unit" "price_unit" DEFAULT 'per_day' NOT NULL,
	"portfolio_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL,
	"rating_avg" numeric(3, 2),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_price_check" CHECK ("venues"."price_min" >= 0 AND "venues"."price_max" >= "venues"."price_min"),
	CONSTRAINT "venues_capacity_check" CHECK (("venues"."capacity_min" IS NULL OR "venues"."capacity_min" > 0)
        AND ("venues"."capacity_max" IS NULL OR "venues"."capacity_max" > 0)
        AND ("venues"."capacity_min" IS NULL OR "venues"."capacity_max" IS NULL OR "venues"."capacity_max" >= "venues"."capacity_min"))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2000),
	"event_type" varchar(100),
	"event_date" timestamp with time zone NOT NULL,
	"location" jsonb NOT NULL,
	"guest_count" integer NOT NULL,
	"budget" bigint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_budget_check" CHECK ("events"."budget" IS NULL OR "events"."budget" >= 0),
	CONSTRAINT "events_guest_count_check" CHECK ("events"."guest_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"vendor_listing_id" uuid,
	"venue_id" uuid,
	"status" "inquiry_status" DEFAULT 'open' NOT NULL,
	"declined_at" timestamp with time zone,
	"accepted_offer_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_one_target_check" CHECK (("inquiries"."vendor_listing_id" IS NOT NULL AND "inquiries"."venue_id" IS NULL) OR ("inquiries"."vendor_listing_id" IS NULL AND "inquiries"."venue_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" varchar(2000) NOT NULL,
	"offer_amount" bigint,
	"offer_status" "offer_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_offer_consistency" CHECK (("messages"."offer_amount" IS NULL AND "messages"."offer_status" IS NULL) OR ("messages"."offer_amount" IS NOT NULL AND "messages"."offer_status" IS NOT NULL AND "messages"."offer_amount" > 0))
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"inquiry_id" uuid,
	"vendor_listing_id" uuid,
	"venue_id" uuid,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"agreed_price" bigint NOT NULL,
	"commission_rate" numeric(5, 4) NOT NULL,
	"commission_amount" bigint NOT NULL,
	"payout_amount" bigint NOT NULL,
	"provider_completed_at" timestamp with time zone,
	"organizer_completed_at" timestamp with time zone,
	"paid_out_at" timestamp with time zone,
	"payout_reference" varchar(255),
	"dispute_reason" varchar(2000),
	"disputed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_one_target_check" CHECK (("bookings"."vendor_listing_id" IS NOT NULL AND "bookings"."venue_id" IS NULL) OR ("bookings"."vendor_listing_id" IS NULL AND "bookings"."venue_id" IS NOT NULL)),
	CONSTRAINT "bookings_amounts_check" CHECK ("bookings"."agreed_price" > 0 AND "bookings"."commission_amount" >= 0 AND "bookings"."payout_amount" >= 0),
	CONSTRAINT "bookings_split_check" CHECK ("bookings"."commission_amount" + "bookings"."payout_amount" = "bookings"."agreed_price"),
	CONSTRAINT "bookings_rate_check" CHECK ("bookings"."commission_rate" >= 0 AND "bookings"."commission_rate" <= 1),
	CONSTRAINT "bookings_paid_out_check" CHECK ("bookings"."paid_out_at" IS NULL OR "bookings"."payout_reference" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"reference" varchar(100) NOT NULL,
	"amount" bigint NOT NULL,
	"platform_fee" bigint NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"raw_webhook_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount" > 0 AND "payments"."platform_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"direction" "review_direction" NOT NULL,
	"provider_type" "provider_type" NOT NULL,
	"rating" integer NOT NULL,
	"comment" varchar(2000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "reviews_not_self_check" CHECK ("reviews"."reviewer_id" <> "reviews"."reviewee_id")
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(200) NOT NULL,
	"target_type" "admin_log_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"notes" varchar(2000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_records" ADD CONSTRAINT "otp_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_profiles" ADD CONSTRAINT "venue_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_profile_id_venue_profiles_id_fk" FOREIGN KEY ("venue_profile_id") REFERENCES "public"."venue_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_type_id_categories_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_vendor_listing_id_vendor_listings_id_fk" FOREIGN KEY ("vendor_listing_id") REFERENCES "public"."vendor_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_accepted_offer_message_id_messages_id_fk" FOREIGN KEY ("accepted_offer_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_listing_id_vendor_listings_id_fk" FOREIGN KEY ("vendor_listing_id") REFERENCES "public"."vendor_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_users_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "otp_records_user_type_idx" ON "otp_records" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "vendor_profiles_status_idx" ON "vendor_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "venue_provider_profiles_status_idx" ON "venue_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_applies_to_uq" ON "categories" USING btree ("slug","applies_to");--> statement-breakpoint
CREATE INDEX "vendor_listings_profile_idx" ON "vendor_listings" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "vendor_listings_category_idx" ON "vendor_listings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "vendor_listings_visibility_idx" ON "vendor_listings" USING btree ("verification_status","is_active");--> statement-breakpoint
CREATE INDEX "vendor_listings_location_idx" ON "vendor_listings" USING btree ("state","city");--> statement-breakpoint
CREATE INDEX "venues_idx" ON "venues" USING btree ("venue_profile_id");--> statement-breakpoint
CREATE INDEX "venues_type_idx" ON "venues" USING btree ("venue_type_id");--> statement-breakpoint
CREATE INDEX "venues_visibility_idx" ON "venues" USING btree ("verification_status","is_active");--> statement-breakpoint
CREATE INDEX "venues_location_idx" ON "venues" USING btree ("state","city");--> statement-breakpoint
CREATE INDEX "events_organizer_date_idx" ON "events" USING btree ("organizer_id","event_date");--> statement-breakpoint
CREATE INDEX "inquiries_organizer_idx" ON "inquiries" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "inquiries_provider_idx" ON "inquiries" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "inquiries_event_idx" ON "inquiries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "inquiries_vendor_listing_idx" ON "inquiries" USING btree ("vendor_listing_id");--> statement-breakpoint
CREATE INDEX "inquiries_venue_idx" ON "inquiries" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inquiries_one_open_per_event_vendor_uq" ON "inquiries" USING btree ("event_id","vendor_listing_id") WHERE "inquiries"."status" = 'open' AND "inquiries"."vendor_listing_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "inquiries_one_open_per_event_venue_uq" ON "inquiries" USING btree ("event_id","venue_id") WHERE "inquiries"."status" = 'open' AND "inquiries"."venue_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "messages_inquiry_created_idx" ON "messages" USING btree ("inquiry_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_one_pending_offer_per_inquiry" ON "messages" USING btree ("inquiry_id") WHERE "messages"."offer_status" = 'pending';--> statement-breakpoint
CREATE INDEX "bookings_organizer_idx" ON "bookings" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "bookings_provider_idx" ON "bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "bookings_event_idx" ON "bookings" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "bookings_vendor_listing_idx" ON "bookings" USING btree ("vendor_listing_id");--> statement-breakpoint
CREATE INDEX "bookings_venue_idx" ON "bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_payouts_due_idx" ON "bookings" USING btree ("updated_at") WHERE "bookings"."status" = 'completed' AND "bookings"."paid_out_at" IS NULL;--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_success_per_booking_uq" ON "payments" USING btree ("booking_id") WHERE "payments"."status" = 'success';--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_booking_reviewer_uq" ON "reviews" USING btree ("booking_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "reviews_reviewee_idx" ON "reviews" USING btree ("reviewee_id");--> statement-breakpoint
CREATE INDEX "admin_logs_target_idx" ON "admin_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "admin_logs_admin_idx" ON "admin_logs" USING btree ("admin_id");