LOCALHOST := http://localhost:8080

up:
	docker compose up --detach

hasura-console:
	cd hasura; hasura console --endpoint http://localhost:8080 --admin-secret secret!
