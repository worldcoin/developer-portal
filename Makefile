LOCALHOST := http://localhost:8080

up:
	docker compose up --detach

hasura-console:
	cd hasura; hasura console --endpoint http://localhost:8080 --admin-secret secret!

hasura-migrate:
	cd hasura; hasura migrate apply --admin-secret secret!

hasura-seed:
	cd hasura; hasura seed apply --admin-secret secret!

hasura-metadata:
	cd hasura; hasura metadata export --admin-secret secret!

hasura-seed-retry:
	@for i in 1 2 3 4 5; do \
		make hasura-seed && break; \
		sleep 2; \
	done
hasura-reset:
	docker compose rm -s -f && docker compose up --detach && make hasura-seed-retry