
ALTER TABLE localisations ALTER COLUMN "short_name" drop default;

ALTER TABLE localisations ALTER COLUMN "world_app_description" drop default;

ALTER TABLE localisations ALTER COLUMN "world_app_button_text" drop default;

ALTER TABLE localisations ALTER COLUMN "description" drop default;

ALTER TABLE localisations ALTER COLUMN "name" drop default;

ALTER TABLE localisations
DROP COLUMN showcase_img_urls;

ALTER TABLE localisations
DROP COLUMN hero_image_url;
