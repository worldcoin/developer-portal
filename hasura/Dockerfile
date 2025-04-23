FROM public.ecr.aws/q0d1m9s3/graphql-engine:v2.47.0.cli-migrations-v3

COPY . /hasura

ENV HASURA_GRAPHQL_MIGRATIONS_DIR /hasura/migrations
ENV HASURA_GRAPHQL_METADATA_DIR  /hasura/metadata
ENV HASURA_GRAPHQL_MIGRATIONS_SERVER_TIMEOUT 3600
