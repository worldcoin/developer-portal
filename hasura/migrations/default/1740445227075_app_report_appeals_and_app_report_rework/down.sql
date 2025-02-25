ALTER TABLE app_report
    DROP CONSTRAINT IF EXISTS purpose_violation_details_check,
    DROP CONSTRAINT IF EXISTS illegal_content_check;
    
DROP TABLE IF EXISTS app_report_appeal;

ALTER TABLE app_report DROP COLUMN illegal_content_country_code;
ALTER TABLE app_report RENAME COLUMN user_pkid TO user_id;
ALTER TABLE app_report RENAME COLUMN illegal_content_legal_reason TO illegal_content_laws_broken;

-- review_status
ALTER TABLE app_report ALTER COLUMN review_status TYPE text;
ALTER TABLE app_report ALTER COLUMN review_status DROP NOT NULL;

DROP TYPE review_status_enum;

CREATE TYPE review_status_enum AS ENUM ('IRRELEVANT', 'CONFIRMED_VIOLATION', 'NO_VIOLATION');

UPDATE app_report SET review_status = 'IRRELEVANT' WHERE review_status::text = 'NOT_ESCALATE';
UPDATE app_report SET review_status = 'CONFIRMED_VIOLATION' WHERE review_status::text = 'ACTIONED';
UPDATE app_report SET review_status = NULL WHERE review_status::text = 'OPEN';
UPDATE app_report SET review_status = 'NO_VIOLATION' WHERE review_status::text = 'NOT_ESCALATE';

ALTER TABLE app_report 
    ALTER COLUMN review_status TYPE review_status_enum USING review_status::review_status_enum;

-- purpose
ALTER TABLE app_report ALTER COLUMN purpose TYPE text;

DROP TYPE purpose_enum;

CREATE TYPE purpose_enum AS ENUM ('ILLEGAL_CONTENT', 'TOS_VIOLATION', 'OTHER');

ALTER TABLE app_report 
    ALTER COLUMN purpose TYPE purpose_enum USING purpose::purpose_enum;

-- illegal_content_sub_category

ALTER TABLE app_report ALTER COLUMN illegal_content_sub_category TYPE text;

UPDATE app_report SET illegal_content_sub_category = 'VIOLATES_ADVERTISING_LAW' WHERE illegal_content_sub_category::text = 'DATA_PROTECTION_PRIVACY';
UPDATE app_report SET illegal_content_sub_category = 'VIOLATES_CONSUMER_PROTECTION_OR_PRIVACY_LAW' WHERE illegal_content_sub_category::text = 'DATA_PROTECTION_PRIVACY';
UPDATE app_report SET illegal_content_sub_category = 'VIOLATES_INTELLECTUAL_PROPERTY_RIGHTS' WHERE illegal_content_sub_category::text = 'DATA_PROTECTION_PRIVACY';
UPDATE app_report SET illegal_content_sub_category = 'CHILD_SEXUAL_ABUSE' WHERE illegal_content_sub_category::text = 'PROTECTION_OF_MINORS';
UPDATE app_report SET illegal_content_sub_category = 'ILLEGAL_HATE_SPEECH' WHERE illegal_content_sub_category::text = 'ILLEGAL_OR_HARMFUL_SPEECH';
UPDATE app_report SET illegal_content_sub_category = 'INCITES_TERRORISM_OR_VIOLENCE' WHERE illegal_content_sub_category::text = 'RISK_FOR_PUBLIC_SECURITY';
UPDATE app_report SET illegal_content_sub_category = 'PROVIDES_OR_FACILITATES_AN_ILLEGAL_SERVICE' WHERE illegal_content_sub_category::text = 'UNSAFE_OR_ILLEGAL_PRODUCTS';

-- drop the new enum type
DROP TYPE illegal_content_sub_category_enum;

CREATE TYPE illegal_content_category_enum AS ENUM (
    'CHILD_SEXUAL_ABUSE',
    'ILLEGAL_HATE_SPEECH',
    'INCITES_TERRORISM_OR_VIOLENCE',
    'PROVIDES_OR_FACILITATES_AN_ILLEGAL_SERVICE',
    'VIOLATES_ADVERTISING_LAW',
    'VIOLATES_CONSUMER_PROTECTION_OR_PRIVACY_LAW',
    'VIOLATES_INTELLECTUAL_PROPERTY_RIGHTS'
);

ALTER TABLE app_report RENAME COLUMN illegal_content_sub_category TO illegal_content_category;
ALTER TABLE app_report ALTER COLUMN illegal_content_category TYPE illegal_content_category_enum USING illegal_content_category::illegal_content_category_enum;
ALTER TABLE app_report ADD COLUMN illegal_content_location text;

UPDATE app_report 
SET illegal_content_location = substring(illegal_content_description from 'illegal_content_location: (.*)$'),
    illegal_content_description = regexp_replace(illegal_content_description, 'illegal_content_location: .*$', '');

-- add constraints
ALTER TABLE app_report
    ADD CONSTRAINT review_conclusion_reason_check CHECK (
        (review_status = 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NOT NULL) OR
        (review_status != 'CONFIRMED_VIOLATION')
    ),
    ADD CONSTRAINT purpose_violation_details_check CHECK (
        (purpose IN ('TOS_VIOLATION', 'OTHER') AND violation IS NOT NULL AND details IS NOT NULL) OR 
        (purpose = 'ILLEGAL_CONTENT')
    ),
    ADD CONSTRAINT illegal_content_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND illegal_content_category IS NOT NULL AND illegal_content_description IS NOT NULL AND illegal_content_location IS NOT NULL) OR
        (purpose != 'ILLEGAL_CONTENT')
    );