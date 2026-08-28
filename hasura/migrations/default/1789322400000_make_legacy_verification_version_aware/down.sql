DROP FUNCTION IF EXISTS public.complete_legacy_app_verification_asset_settlement(
    uuid,
    text,
    text,
    boolean,
    text
);

DROP FUNCTION IF EXISTS public.reviewer_claim_legacy_app_verification_asset_settlements(
    text,
    integer
);

DROP FUNCTION public.legacy_verify_app_metadata(
    text,
    text,
    uuid,
    timestamptz,
    text,
    timestamptz,
    jsonb,
    text,
    boolean,
    boolean,
    jsonb,
    jsonb
);

DROP INDEX public.app_metadata_legacy_verification_operation_id_key;

ALTER TABLE public.app_metadata
DROP COLUMN legacy_verification_operation_id;

DROP FUNCTION IF EXISTS public.register_legacy_app_verification_asset_settlement(
    uuid,
    text,
    text,
    timestamptz,
    jsonb,
    jsonb
);

DROP TABLE IF EXISTS public.legacy_app_verification_asset_settlement;
