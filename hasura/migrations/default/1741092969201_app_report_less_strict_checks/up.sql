ALTER TABLE app_report
    DROP CONSTRAINT purpose_violation_details_check;
    
ALTER TABLE app_report
    ADD CONSTRAINT purpose_details_check CHECK (
        (purpose != 'ILLEGAL_CONTENT' AND details IS NOT NULL) OR 
        (purpose = 'ILLEGAL_CONTENT')
    );
