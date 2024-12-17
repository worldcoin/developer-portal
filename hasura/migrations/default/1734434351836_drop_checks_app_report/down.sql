ALTER TABLE app_report
    DROP CONSTRAINT IF EXISTS details_check,
    DROP CONSTRAINT IF EXISTS review_conclusion_reason_check,
    DROP CONSTRAINT IF EXISTS purpose_violation_details_check,
    DROP CONSTRAINT IF EXISTS illegal_content_check,
    DROP CONSTRAINT IF EXISTS illegal_content_laws_broken_check;

UPDATE app_report
    SET illegal_content_laws_broken = NULL;

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