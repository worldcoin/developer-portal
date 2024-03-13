CREATE TABLE "public"."app_rankings" (
        "id" varchar NOT NULL UNIQUE DEFAULT gen_random_friendly_id('rankings'),
        "country" varchar NOT NULL,
        "platform" varchar NOT NULL,
        "rankings" text[] NULL,
        PRIMARY KEY ("id")
    );
