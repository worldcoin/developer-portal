-- review_status
ALTER TABLE app_report
    DROP CONSTRAINT review_conclusion_reason_check;

ALTER TABLE app_report ALTER COLUMN review_status TYPE text;

DROP TYPE review_status_enum;

CREATE TYPE review_status_enum_new AS ENUM ('OPEN','NOT_ESCALATE', 'ESCALATE', 'APPEALED','REVIEW','ACTIONED');

UPDATE app_report SET review_status = 'OPEN' WHERE review_status IS NULL;
UPDATE app_report SET review_status = 'NOT_ESCALATE' WHERE review_status::text = 'IRRELEVANT';
UPDATE app_report SET review_status = 'NOT_ESCALATE' WHERE review_status::text = 'NO_VIOLATION';
UPDATE app_report SET review_status = 'ACTIONED' WHERE review_status::text = 'CONFIRMED_VIOLATION';

ALTER TABLE app_report 
    ALTER COLUMN review_status TYPE review_status_enum_new USING review_status::review_status_enum_new,
    ALTER COLUMN review_status SET NOT NULL;
ALTER TYPE review_status_enum_new RENAME TO review_status_enum;

-- purpose
ALTER TABLE app_report
    DROP CONSTRAINT purpose_violation_details_check;
ALTER TABLE app_report
    DROP CONSTRAINT illegal_content_check;

ALTER TABLE app_report ALTER COLUMN purpose TYPE text;

DROP TYPE purpose_enum;

CREATE TYPE purpose_enum_new AS ENUM ('ILLEGAL_CONTENT', 'FRAUD', 'SPAM', 'APP_UNSAFE', 'OTHER');

UPDATE app_report SET purpose = 'OTHER' WHERE purpose::text = 'TOS_VIOLATION';

ALTER TABLE app_report 
    ALTER COLUMN purpose TYPE purpose_enum_new USING purpose::purpose_enum_new,
    ALTER COLUMN purpose SET NOT NULL;
ALTER TYPE purpose_enum_new RENAME TO purpose_enum;

ALTER TABLE app_report RENAME COLUMN illegal_content_laws_broken TO illegal_content_legal_reason;
ALTER TABLE app_report RENAME COLUMN user_id TO user_pkid;
ALTER TABLE app_report ADD COLUMN country_code varchar(2);

CREATE TABLE app_report_appeal (
    "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('report_appeal'),
    "app_report_id" varchar(50) NOT NULL,
    "appeal_comment" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id"),
    FOREIGN KEY ("app_report_id") REFERENCES "public"."app_report"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE ("id")
);
