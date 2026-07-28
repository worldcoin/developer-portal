ALTER TABLE "public"."user"
ADD COLUMN "avatar_color" text NULL;

ALTER TABLE "public"."user"
ADD CONSTRAINT "user_avatar_color_check"
CHECK (
  "avatar_color" IS NULL
  OR "avatar_color" IN (
    'blue',
    'azure',
    'purple',
    'green',
    'sea',
    'yellow',
    'orange',
    'lightOrange',
    'pink'
  )
);
