CREATE TABLE notification_log (
    "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('nlog') ,
    "app_id" varchar(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mini_app_path" TEXT NOT NULL,
    "message" TEXT DEFAULT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("id"),
    FOREIGN KEY (app_id) REFERENCES public.app(id)
);

CREATE TABLE notification_log_wallet_address(
    -- TODO: could have a composite key, assuming that 
    -- that notifications do not carry duplicate wallet addresses
    "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('nlog_addr'),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notification_log_id" varchar(50) NOT NULL,
    "wallet_address" VARCHAR(255) NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("id"),
    FOREIGN KEY (notification_log_id) REFERENCES public.notification_log(id) ON UPDATE CASCADE ON DELETE CASCADE
);