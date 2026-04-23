-- ORO's SIWE page loads from https://app.worldoro.com but only
-- https://worldoro.com (integration_url) is registered. Bedrock now
-- requires an exact host match, so we add the subdomain to
-- associated_domains for all metadata rows.
UPDATE app_metadata
SET associated_domains = COALESCE(associated_domains, '{}') || '{https://app.worldoro.com}'
WHERE app_id = 'app_f1e44837a5e3c2af4da8925b46027645'
  AND NOT ('https://app.worldoro.com' = ANY(COALESCE(associated_domains, '{}')));
