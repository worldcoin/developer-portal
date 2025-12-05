LOCALHOST := http://localhost:8080

up:
	docker compose up --detach

hasura-console:
	cd hasura; hasura console --endpoint http://localhost:8080 --admin-secret secret!

hasura-migrate:
	cd hasura; hasura migrate apply --admin-secret secret! --database-name default

hasura-seed:
	cd hasura; hasura seed apply --admin-secret secret! --database-name default

hasura-metadata:
	cd hasura; hasura metadata export --admin-secret secret!