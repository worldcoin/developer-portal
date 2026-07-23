CREATE TABLE
    "public"."sandbox_access_request" (
        "id" varchar NOT NULL DEFAULT gen_random_friendly_id ('sbxreq'),
        "google_email" varchar NOT NULL,
        "portal_email" varchar NOT NULL,
        "user_id" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now (),
        "processed_at" timestamptz,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE restrict ON DELETE cascade,
        CONSTRAINT "unique_sandbox_access_request_user_id" UNIQUE ("user_id")
    );

