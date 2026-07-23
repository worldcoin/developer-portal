CREATE TABLE
    "public"."sandbox_access_request" (
        "id" varchar NOT NULL DEFAULT gen_random_friendly_id ('sandbox_request'),
        "google_email" varchar NOT NULL,
        "requested_by" varchar NOT NULL,
        "team_id" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now (),
        "processed_at" timestamptz,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE restrict ON DELETE cascade,
        CONSTRAINT "unique_sandbox_access_request_email_team" UNIQUE ("google_email", "team_id")
    );
