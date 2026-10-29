CREATE TYPE "public"."target_type" AS ENUM('vendor', 'venue');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."otp_type" AS ENUM('email_verification', 'password_reset', 'two_factor', 'account_deletion');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('fixed', 'per_day', 'per_hour', 'per_guest');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'completed', 'disputed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."admin_log_target_type" AS ENUM('vendor_profile', 'venue_provider_profile', 'venue', 'vendor_listing', 'user');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255),
	"google_auth_id" varchar(100),
	"is_staff" boolean DEFAULT false NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"type" "otp_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	CONSTRAINT "otp_records_attempts_check" CHECK (attempts >= 0 AND max_attempts > 0)
);
--> statement-breakpoint
CREATE TABLE "organizer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"description" varchar(2000),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"state" varchar(100),
	"city" varchar(100),
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bank_code" varchar(20),
	"account_number" varchar(20),
	"account_name" varchar(255),
	"subaccount_code" varchar(100),
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "venue_provider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bank_code" varchar(20),
	"subaccount_code" varchar(100),
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"account_number" varchar(20),
	"account_name" varchar(255),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venue_provider_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applies_to" "target_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_profile_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2000),
	"price_min" integer,
	"price_max" integer,
	"price_unit" "price_unit" DEFAULT 'fixed' NOT NULL,
	"portfolio_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_listings_price_range_check" CHECK ((price_min IS NULL OR price_min >= 0)
        AND (price_max IS NULL OR price_max >= 0)
        AND (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)),
	CONSTRAINT "vendor_listings_rating_avg_check" CHECK (rating_avg >= 0 AND rating_avg <= 5),
	CONSTRAINT "vendor_listings_rating_count_check" CHECK (rating_count >= 0)
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_provider_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(2000),
	"venue_type_id" uuid NOT NULL,
	"address" varchar(500) NOT NULL,
	"state" varchar(100),
	"city" varchar(100),
	"capacity_min" integer,
	"capacity_max" integer,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_min" integer,
	"price_max" integer,
	"portfolio_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(1000),
	"rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_capacity_range_check" CHECK ((capacity_min IS NULL OR capacity_min >= 0)
        AND (capacity_max IS NULL OR capacity_max >= 0)
        AND (capacity_min IS NULL OR capacity_max IS NULL OR capacity_min <= capacity_max)),
	CONSTRAINT "venues_price_range_check" CHECK ((price_min IS NULL OR price_min >= 0)
        AND (price_max IS NULL OR price_max >= 0)
        AND (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)),
	CONSTRAINT "venues_rating_avg_check" CHECK (rating_avg >= 0 AND rating_avg <= 5),
	CONSTRAINT "venues_rating_count_check" CHECK (rating_count >= 0)
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"event_type" varchar(100),
	"event_date" timestamp with time zone NOT NULL,
	"location" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"budget" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organizer_id" uuid NOT NULL,
	"target_type" "target_type" NOT NULL,
	"vendor_listing_id" uuid,
	"venue_id" uuid,
	"status" "inquiry_status" DEFAULT 'open' NOT NULL,
	"declined_at" timestamp with time zone,
	"accepted_offer_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_exactly_one_target" CHECK ((vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)),
	CONSTRAINT "inquiries_target_matches_type" CHECK ((target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" varchar(2000) NOT NULL,
	"proposed_price" integer,
	"offer_status" "offer_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"organizer_id" uuid NOT NULL,
	"target_type" "target_type" NOT NULL,
	"vendor_listing_id" uuid,
	"venue_id" uuid,
	"provider_id" uuid NOT NULL,
	"agreed_price" integer NOT NULL,
	"commission_rate" numeric(5, 4) DEFAULT '0.05' NOT NULL,
	"commission_amount" integer NOT NULL,
	"payout_amount" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"vendor_marked_complete_at" timestamp with time zone,
	"organizer_confirmed_complete_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_inquiry_id_unique" UNIQUE("inquiry_id"),
	CONSTRAINT "bookings_exactly_one_target" CHECK ((vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)),
	CONSTRAINT "bookings_target_matches_type" CHECK ((target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"reference" varchar(100) NOT NULL,
	"subaccount_code" varchar(100),
	"amount" integer NOT NULL,
	"platform_fee" integer,
	"payout_amount" integer,
	"currency" varchar(10) DEFAULT 'NGN' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_webhook_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"target_type" "target_type" NOT NULL,
	"vendor_listing_id" uuid,
	"venue_id" uuid,
	"rating" integer NOT NULL,
	"comment" varchar(2000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK (rating BETWEEN 1 AND 5),
	CONSTRAINT "reviews_exactly_one_target" CHECK ((vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)),
	CONSTRAINT "reviews_target_matches_type" CHECK ((target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" "admin_log_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"notes" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_records" ADD CONSTRAINT "otp_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_provider_profiles" ADD CONSTRAINT "venue_provider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_provider_id_venue_provider_profiles_id_fk" FOREIGN KEY ("venue_provider_id") REFERENCES "public"."venue_provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_type_id_categories_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_vendor_listing_id_vendor_listings_id_fk" FOREIGN KEY ("vendor_listing_id") REFERENCES "public"."vendor_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_accepted_offer_message_id_messages_id_fk" FOREIGN KEY ("accepted_offer_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_listing_id_vendor_listings_id_fk" FOREIGN KEY ("vendor_listing_id") REFERENCES "public"."vendor_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_listing_id_vendor_listings_id_fk" FOREIGN KEY ("vendor_listing_id") REFERENCES "public"."vendor_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "otp_records_user_type_idx" ON "otp_records" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "vendor_profiles_status_idx" ON "vendor_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "venue_provider_profiles_status_idx" ON "venue_provider_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_applies_to_idx" ON "categories" USING btree ("slug","applies_to");--> statement-breakpoint
CREATE INDEX "categories_applies_to_active_idx" ON "categories" USING btree ("applies_to","is_active");--> statement-breakpoint
CREATE INDEX "vendor_listings_vendor_idx" ON "vendor_listings" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "vendor_listings_category_idx" ON "vendor_listings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "vendor_listings_status_idx" ON "vendor_listings" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "vendor_listings_active_idx" ON "vendor_listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "venues_provider_idx" ON "venues" USING btree ("venue_provider_id");--> statement-breakpoint
CREATE INDEX "venues_status_idx" ON "venues" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "venues_venue_type_idx" ON "venues" USING btree ("venue_type_id");--> statement-breakpoint
CREATE INDEX "inquiries_vendor_listing_idx" ON "inquiries" USING btree ("vendor_listing_id");--> statement-breakpoint
CREATE INDEX "inquiries_venue_idx" ON "inquiries" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "inquiries_organizer_idx" ON "inquiries" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "messages_inquiry_idx" ON "messages" USING btree ("inquiry_id");--> statement-breakpoint
CREATE INDEX "bookings_vendor_listing_idx" ON "bookings" USING btree ("vendor_listing_id");--> statement-breakpoint
CREATE INDEX "bookings_venue_idx" ON "bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "bookings_organizer_idx" ON "bookings" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "bookings_provider_idx" ON "bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_booking_reviewer_unique" ON "reviews" USING btree ("booking_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "reviews_vendor_listing_idx" ON "reviews" USING btree ("vendor_listing_id");--> statement-breakpoint
CREATE INDEX "reviews_venue_idx" ON "reviews" USING btree ("venue_id");