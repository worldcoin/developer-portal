CREATE TABLE "public"."app_report" (
    "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('report'),
    "created_at" timestamptz NOT NULL DEFAULT now(), 
    "app_id" varchar(50) NOT NULL, 
    "app_name" text NOT NULL, 
    "details" text NOT NULL, 
    "reporter_email" text, 
    PRIMARY KEY ("id"), 
    FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE, 
    UNIQUE ("id"));
