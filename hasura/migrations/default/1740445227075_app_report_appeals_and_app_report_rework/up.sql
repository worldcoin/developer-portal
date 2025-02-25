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

-- illegal_content_category
ALTER TABLE app_report ALTER COLUMN illegal_content_category TYPE text;
ALTER TABLE app_report RENAME COLUMN illegal_content_category TO illegal_content_sub_category;

DROP TYPE illegal_content_category_enum;

CREATE TYPE illegal_content_sub_category_enum AS ENUM (
    'DATA_PROTECTION_PRIVACY', 
    'DEFAMATION', 
    'ILLEGAL_OR_HARMFUL_SPEECH', 
    'NEGATIVE_EFFECTS_ON_CIVIC_DISCOURSE', 
    'NON_CONSENSUAL_BEHAVIOR', 
    'PORNOGRAPHY', 
    'PROTECTION_OF_MINORS', 
    'RISK_FOR_PUBLIC_SECURITY', 
    'SELF_HARM', 
    'UNSAFE_OR_ILLEGAL_PRODUCTS', 
    'VIOLENCE',
    'OTHER'
    );

UPDATE app_report SET illegal_content_sub_category = 'OTHER' WHERE illegal_content_sub_category IS NULL;
UPDATE app_report SET illegal_content_sub_category = 'UNSAFE_OR_ILLEGAL_PRODUCTS' WHERE illegal_content_sub_category::text = 'PROVIDES_OR_FACILITATES_AN_ILLEGAL_SERVICE';
UPDATE app_report SET illegal_content_sub_category = 'RISK_FOR_PUBLIC_SECURITY' WHERE illegal_content_sub_category::text = 'INCITES_TERRORISM_OR_VIOLENCE';
UPDATE app_report SET illegal_content_sub_category = 'ILLEGAL_OR_HARMFUL_SPEECH' WHERE illegal_content_sub_category::text = 'ILLEGAL_HATE_SPEECH';
UPDATE app_report SET illegal_content_sub_category = 'PROTECTION_OF_MINORS' WHERE illegal_content_sub_category::text = 'CHILD_SEXUAL_ABUSE';
UPDATE app_report SET illegal_content_sub_category = 'DATA_PROTECTION_PRIVACY' WHERE illegal_content_sub_category::text = 'VIOLATES_INTELLECTUAL_PROPERTY_RIGHTS';
UPDATE app_report SET illegal_content_sub_category = 'DATA_PROTECTION_PRIVACY' WHERE illegal_content_sub_category::text = 'VIOLATES_CONSUMER_PROTECTION_OR_PRIVACY_LAW';
UPDATE app_report SET illegal_content_sub_category = 'DATA_PROTECTION_PRIVACY' WHERE illegal_content_sub_category::text = 'VIOLATES_ADVERTISING_LAW';


ALTER TABLE app_report 
    ALTER COLUMN illegal_content_sub_category TYPE illegal_content_sub_category_enum USING illegal_content_sub_category::illegal_content_sub_category_enum,
    ALTER COLUMN illegal_content_sub_category SET NOT NULL;

ALTER TABLE app_report RENAME COLUMN illegal_content_laws_broken TO illegal_content_legal_reason;
ALTER TABLE app_report RENAME COLUMN user_id TO user_pkid;
ALTER TABLE app_report ADD COLUMN illegal_content_country_code text;

UPDATE app_report SET illegal_content_description = illegal_content_description || ' illegal_content_location: ' || illegal_content_location;
ALTER TABLE app_report DROP COLUMN illegal_content_location;

-- constraints
ALTER TABLE app_report
    ADD CONSTRAINT purpose_violation_details_check CHECK (
        (purpose != 'ILLEGAL_CONTENT' AND violation IS NOT NULL AND details IS NOT NULL) OR 
        (purpose = 'ILLEGAL_CONTENT')
    ),
    ADD CONSTRAINT illegal_content_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND illegal_content_sub_category IS NOT NULL AND illegal_content_description IS NOT NULL) OR
        (purpose != 'ILLEGAL_CONTENT')
    );

CREATE TABLE app_report_appeal (
    "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('report_appeal'),
    "app_report_id" varchar(50) NOT NULL,
    "appeal_comment" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id"),
    FOREIGN KEY ("app_report_id") REFERENCES "public"."app_report"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE ("id")
);
