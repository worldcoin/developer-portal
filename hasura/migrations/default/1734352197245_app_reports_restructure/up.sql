CREATE TYPE review_status_enum AS ENUM ('IRRELEVANT', 'CONFIRMED_VIOLATION', 'NO_VIOLATION');
CREATE TYPE purpose_enum AS ENUM ('ILLEGAL_CONTENT', 'TOS_VIOLATION', 'OTHER');
CREATE TYPE violation_enum AS ENUM ('FEATURES', 'CORE_FUNCTIONALITY', 'MALICIOUS_APP');
CREATE TYPE illegal_content_category_enum AS ENUM (
    'PROVIDES_OR_FACILITATES_AN_ILLEGAL_SERVICE',
    'INCITES_TERRORISM_OR_VIOLENCE',
    'ILLEGAL_HATE_SPEECH',
    'CHILD_SEXUAL_ABUSE',
    'VIOLATES_INTELLECTUAL_PROPERTY_RIGHTS',
    'VIOLATES_CONSUMER_PROTECTION_OR_PRIVACY_LAW',
    'VIOLATES_ADVERTISING_LAW',
    'OTHER'
);

-- Set values for existing rows to avoid check constraint fails, columns were not used as of now
UPDATE app_report
SET purpose = 'OTHER',
    violation = 'CORE_FUNCTIONALITY';

ALTER TABLE app_report
    ADD COLUMN reviewed_at TIMESTAMPTZ,
    ADD COLUMN reviewed_by TEXT,
    ADD COLUMN review_status review_status_enum,
    ADD COLUMN review_conclusion_reason TEXT,
    ALTER COLUMN purpose TYPE purpose_enum USING purpose::purpose_enum,
    ALTER COLUMN violation TYPE violation_enum USING violation::violation_enum,
    ALTER COLUMN details DROP NOT NULL,
    ADD COLUMN illegal_content_category illegal_content_category_enum,
    ADD COLUMN illegal_content_laws_broken TEXT,
    ADD COLUMN illegal_content_description TEXT,
    ADD COLUMN illegal_content_location TEXT;

ALTER TABLE app_report
    ADD CONSTRAINT details_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND details IS NULL) OR
        (purpose != 'ILLEGAL_CONTENT' AND details IS NOT NULL)
    ),
    ADD CONSTRAINT review_conclusion_reason_check CHECK (
        (review_status = 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NOT NULL) OR
        (review_status != 'CONFIRMED_VIOLATION' AND review_conclusion_reason IS NULL)
    ),
    ADD CONSTRAINT purpose_violation_details_check CHECK (
        (purpose IN ('TOS_VIOLATION', 'OTHER') AND violation IS NOT NULL AND details IS NOT NULL) OR
        (purpose NOT IN ('TOS_VIOLATION', 'OTHER') AND violation IS NULL AND details IS NULL)
    ),
    ADD CONSTRAINT illegal_content_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND illegal_content_category IS NOT NULL AND illegal_content_description IS NOT NULL AND illegal_content_location IS NOT NULL) OR
        (purpose != 'ILLEGAL_CONTENT' AND illegal_content_category IS NULL AND illegal_content_description IS NULL AND illegal_content_location IS NULL)
    ),
    ADD CONSTRAINT illegal_content_laws_broken_check CHECK (
        (purpose = 'ILLEGAL_CONTENT' AND illegal_content_laws_broken IS NULL) OR
        (purpose != 'ILLEGAL_CONTENT' AND illegal_content_laws_broken IS NULL)
    );