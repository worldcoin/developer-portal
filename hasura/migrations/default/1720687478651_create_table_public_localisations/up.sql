CREATE TABLE
    "public"."localisations" (
        "id" varchar NOT NULL DEFAULT gen_random_friendly_id ('localisation'),
        "app_metadata_id" varchar NOT NULL,
        "locale" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "world_app_button_text" varchar NOT NULL,
        "world_app_description" varchar NOT NULL,
        "short_name" varchar NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now (),
        "updated_at" timestamptz NOT NULL DEFAULT now (),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("app_metadata_id") REFERENCES "public"."app_metadata" ("id") ON UPDATE restrict ON DELETE cascade,
        UNIQUE ("id")
    );

CREATE TRIGGER "set_public_localisations_updated_at" BEFORE
UPDATE ON "public"."localisations" FOR EACH ROW EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at" ();

COMMENT ON TRIGGER "set_public_localisations_updated_at" ON "public"."localisations" IS 'trigger to set value of column "updated_at" to current timestamp on row update';