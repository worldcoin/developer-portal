-- Remove https://app.worldoro.com from ORO's associated_domains.
UPDATE app_metadata
SET associated_domains = array_remove(associated_domains, 'https://app.worldoro.com')
WHERE app_id = 'app_f1e44837a5e3c2af4da8925b46027645';
