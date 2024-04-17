<a href="https://developer.worldcoin.org">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-header.png" alt="" />
</a>

# Developer Portal

The Worldcoin Developer Portal provides tools to interact with the [World ID Protocol](https://worldcoin.org/world-id). Along with [IDKit](https://github.com/worldcoin/idkit-js), it's the fastest way to get started with proof of personhood 🚀

## 📄 Documentation

All the technical docs for the Worldcoin SDK, World ID Protocol, examples, guides can be found at https://docs.worldcoin.org/

## 🧑‍💻 Developing Locally

The Developer Portal uses some external services to operate. You do **not** need all the real credentials to run locally.

1. Copy the `.env.test` into a local env file

```
cd web/
cp .env.test .env
```

2. Edit any environment variables for which you have real credentials.
3. AWS access (for KMS) is required to run the Developer Portal locally. KMS is used to sign/encrypt, particularly for Sign in with World ID. You will need to have AWS credentials in your env with relevant permissions to run KMS. Here is an [IAM sample policy](aws-role-sample-policy.json) for this.
   1. If you are a core contributor with AWS access to TFH, follow the instructions [here](https://github.com/worldcoin/developer-portal-deployment#local-development) instead.

### Starting the app

The following command will start two containers with the Postgres database, and Hasura server. Additionally, it will run the Next.js app from the [/web](./web) directory. All Hasura migrations and metadata are automatically applied.

```bash
docker compose up --detach
cd web && pnpm dev
```

### Updating Database Model

If you need to update anything related to the database (model, permissions, events, etc.) the easiest way is with the Hasura console.

1. Follow instructions to install the [Hasura CLI](https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli/).
2. Launch the Hasura console.
   ```bash
   cd hasura
   hasura console --endpoint http://localhost:8080 --admin-secret secret!
   ```

> **Warning** Make sure to only make the changes in the Hasura console (usually `http://localhost:9665`), if you make changes on `http://localhost:8080`the migrations will not be generated and your changes will be lost.

> 💡 The admin secret in stored in `docker-compose.yml` file in the root of the repo.

