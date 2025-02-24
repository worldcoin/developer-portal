-- drop the new table first
DROP TABLE IF EXISTS app_report_appeal;

-- revert column changes
ALTER TABLE app_report DROP COLUMN country_code;
ALTER TABLE app_report RENAME COLUMN user_pkid TO user_id;
ALTER TABLE app_report RENAME COLUMN illegal_content_legal_reason TO illegal_content_laws_broken;

-- restore the original constraint
ALTER TABLE app_report
    ADD CONSTRAINT review_conclusion_reason_check CHECK (
        (review_status = 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NOT NULL) OR
        (review_status != 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NULL)
    );

-- revert the enum type changes
ALTER TABLE app_report ALTER COLUMN review_status TYPE text;

DROP TYPE review_status_enum;

CREATE TYPE review_status_enum AS ENUM ('IRRELEVANT', 'CONFIRMED_VIOLATION', 'NO_VIOLATION');

UPDATE app_report SET review_status = 'IRRELEVANT' WHERE review_status::text = 'NOT_ESCALATE';
UPDATE app_report SET review_status = 'CONFIRMED_VIOLATION' WHERE review_status::text = 'ACTIONED';
UPDATE app_report SET review_status = NULL WHERE review_status::text = 'OPEN';
UPDATE app_report SET review_status = 'NO_VIOLATION' WHERE review_status::text = 'NOT_ESCALATE';

ALTER TABLE app_report 
    ALTER COLUMN review_status TYPE review_status_enum USING review_status::review_status_enum,
    ALTER COLUMN review_status DROP NOT NULL;

