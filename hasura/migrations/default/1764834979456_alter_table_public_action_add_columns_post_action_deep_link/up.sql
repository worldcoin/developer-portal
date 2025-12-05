alter table "public"."action" 
    add column "post_action_deep_link_ios" text null,
    add column "post_action_deep_link_android" text null;

comment on column "public"."action"."post_action_deep_link_ios" is E'If specified, after action completion, allow users to continue to the iOS app specified by the deep link';
comment on column "public"."action"."post_action_deep_link_android" is E'If specified, after action completion, allow users to continue to the Android app specified by the deep link';
