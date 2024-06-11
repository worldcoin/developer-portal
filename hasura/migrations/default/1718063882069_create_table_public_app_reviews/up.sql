CREATE TABLE
    "public"."app_reviews" (
        "id" varchar NOT NULL UNIQUE DEFAULT gen_random_friendly_id ('reviews'),
        "nullifier_hash" text NOT NULL,
        "app_id" varchar NOT NULL,
        "country" varchar NOT NULL,
        "rating" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now (),
        "updated_at" timestamptz NOT NULL DEFAULT now (),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("app_id") REFERENCES "public"."app" ("id") ON UPDATE restrict ON DELETE cascade,
        UNIQUE ("nullifier_hash")
    );

CREATE TRIGGER "set_public_app_reviews_updated_at" BEFORE
UPDATE ON "public"."app_reviews" FOR EACH ROW EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_app_reviews_updated_at" ON "public"."app_reviews" IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE FUNCTION compute_average_rating(app_metadata_row app_metadata)
RETURNS numeric AS $$
    SELECT AVG(rating)
    FROM "public"."app_reviews"
    WHERE app_id = app_metadata_row.app_id
$$ LANGUAGE sql STABLE;