CREATE TABLE "public"."invite" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('inv'::character varying),
  "team_id" varchar NOT NULL,
  "expires_at" timestamptz NOT NULL DEFAULT now() + '7 day'::interval,
  "email" text NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE cascade ON DELETE cascade,
  UNIQUE ("id")
);

COMMENT ON TABLE "public"."invite" IS E'Invites';
