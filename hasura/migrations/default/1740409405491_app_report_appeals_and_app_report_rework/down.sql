-- drop the new table first
DROP TABLE IF EXISTS app_report_appeal;

-- revert column changes
ALTER TABLE app_report DROP COLUMN country_code;
ALTER TABLE app_report RENAME COLUMN user_pkid TO user_id;
ALTER TABLE app_report RENAME COLUMN illegal_content_legal_reason TO illegal_content_laws_broken;

-- review_status
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

ALTER TABLE app_report
    ADD CONSTRAINT review_conclusion_reason_check CHECK (
        (review_status = 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NOT NULL) OR
        (review_status != 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NULL)
    );

-- purpose
ALTER TABLE app_report ALTER COLUMN purpose TYPE text;

DROP TYPE purpose_enum;

CREATE TYPE purpose_enum AS ENUM ('ILLEGAL_CONTENT', 'TOS_VIOLATION', 'OTHER');

ALTER TABLE app_report 
    ALTER COLUMN purpose TYPE purpose_enum USING purpose::purpose_enum;

ALTER TABLE app_report
    ADD CONSTRAINT purpose_violation_details_check CHECK (
        (purpose IN ('TOS_VIOLATION', 'OTHER') AND violation IS NOT NULL AND details IS NOT NULL) OR 
        (purpose = 'ILLEGAL_CONTENT')
    );

ALTER TABLE app_report
    ADD CONSTRAINT illegal_content_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND illegal_content_category IS NOT NULL AND illegal_content_description IS NOT NULL AND illegal_content_location IS NOT NULL) OR
        (purpose != 'ILLEGAL_CONTENT')
    );