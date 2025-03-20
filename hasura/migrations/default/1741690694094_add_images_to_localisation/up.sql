
alter table localisations add column "hero_image_url" varchar
 not null default ''::character varying;

alter table localisations add column "showcase_img_urls" text[]
 null;

alter table localisations alter column "name" set default ''::character varying;

alter table localisations alter column "description" set default ''::character varying;

alter table localisations alter column "world_app_button_text" set default 'Use Integration'::character varying;

alter table localisations alter column "world_app_description" set default ''::character varying;

alter table localisations alter column "short_name" set default ''::character varying;
