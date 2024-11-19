
create table layout (
  id varchar(50) not null default gen_random_friendly_id('lt'),
  created_at timestamp with time zone default now(),
  primary key (id)
);

create table layout_category (
  id varchar(50) not null default gen_random_friendly_id('lt_cat'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  category text not null,
  layout_id varchar(50) not null,
  foreign key (layout_id) references layout(id) on delete cascade,
  primary key (id)
);

create table layout_secondary_category (
  id varchar(50) not null default gen_random_friendly_id('lt_sec_cat'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  layout_category_id varchar(50) not null,
  title text not null,
  subtitle text not null,
  background_color_hex text,
  background_image_url text,
  check (
    (background_color_hex is not null and background_image_url is null) or
    (background_color_hex is null and background_image_url is not null)
    ),
  foreign key (layout_category_id) references layout_category(id) on delete cascade,
  primary key (id)
);

create table layout_banner_collection (
  id varchar(50) not null default gen_random_friendly_id('lt_banner_coll'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  layout_category_id varchar(50),
  layout_secondary_category_id varchar(50),
  title text not null,
  foreign key (layout_category_id) references layout_category(id) on delete cascade,
  foreign key (layout_secondary_category_id) references layout_secondary_category(id) on delete cascade,
  primary key (id)
);

create table layout_banner (
  id varchar(50) not null default gen_random_friendly_id('lt_banner'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  layout_category_id varchar(50),
  layout_secondary_category_id varchar(50),
  layout_banner_collection_id varchar(50),
  highlight_color_hex text not null,
  title text not null,
  title_color_hex text not null,
  subtitle text not null,
  subtitle_color_hex text not null,
  background_color_hex text,
  background_image_url text
  check (
    (background_color_hex is not null and background_image_url is null) or
    (background_color_hex is null and background_image_url is not null)
    ),
  foreign key (layout_category_id) references layout_category(id) on delete cascade,
  foreign key (layout_secondary_category_id) references layout_secondary_category(id) on delete cascade,
  foreign key (layout_banner_collection_id) references layout_banner_collection(id) on delete cascade,
  primary key (id)
);

create table layout_app_collection (
  id varchar(50) not null default gen_random_friendly_id('lt_app_coll'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  layout_category_id varchar(50),
  layout_secondary_category_id varchar(50),
  title text not null,
  indexed boolean not null,
  foreign key (layout_category_id) references layout_category(id) on delete cascade,
  foreign key (layout_secondary_category_id) references layout_secondary_category(id) on delete cascade,
  primary key (id)
);

create table layout_app (
  id varchar(50) not null default gen_random_friendly_id('lt_app'),
  created_at timestamp with time zone default now(),
  location_index integer not null,
  layout_category_id varchar(50),
  layout_secondary_category_id varchar(50),
  layout_app_collection_id varchar(50),
  app_id varchar(50) not null,
  foreign key (layout_category_id) references layout_category(id) on delete cascade,
  foreign key (layout_secondary_category_id) references layout_secondary_category(id) on delete cascade,
  foreign key (layout_app_collection_id) references layout_app_collection(id) on delete cascade,
  foreign key (app_id) references app(id) on delete cascade,
  primary key (id)
);
