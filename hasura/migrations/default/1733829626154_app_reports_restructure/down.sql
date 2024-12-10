-- Remove constraints
ALTER TABLE app_report
    DROP CONSTRAINT details_check,
    DROP CONSTRAINT review_conclusion_reason_check,
    DROP CONSTRAINT purpose_violation_details_check,
    DROP CONSTRAINT illegal_content_check,
    DROP CONSTRAINT illegal_content_laws_broken_check;

-- Revert column types
ALTER TABLE app_report
    ALTER COLUMN purpose TYPE text USING purpose::text,
    ALTER COLUMN violation TYPE text USING violation::text,
    ALTER COLUMN details SET NOT NULL;


-- Drop newly added columns
ALTER TABLE app_report
    DROP COLUMN reviewed_at,
    DROP COLUMN reviewed_by,
    DROP COLUMN review_status,
    DROP COLUMN review_conclusion_reason,
    DROP COLUMN illegal_content_category,
    DROP COLUMN illegal_content_laws_broken,
    DROP COLUMN illegal_content_description,
    DROP COLUMN illegal_content_location;

-- Drop enums
DROP TYPE review_status_enum;
DROP TYPE purpose_enum;
DROP TYPE violation_enum;
DROP TYPE illegal_content_category_enum;

UPDATE app_report
SET purpose = NULL,
    violation = NULL;
