update "public"."nullifier" set "uses" = 0 where "uses" is null;
alter table "public"."nullifier" alter column "uses" set not null;
