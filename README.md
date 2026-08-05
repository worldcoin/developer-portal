<a href="https://developer.world.org">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-header.png" alt="" />
</a>

# Developer Portal

The World Developer Portal provides tools to interact with the [World ID Protocol](https://world.org/world-id). Along with [IDKit](https://github.com/worldcoin/idkit-js), it's the fastest way to get started with proof of personhood 🚀

## 📄 Documentation

All the technical docs for the World SDK, World ID Protocol, examples, guides can be found at https://docs.world.org/

## 🧑‍💻 Developing Locally

The Developer Portal uses some external services to operate. You do **not** need all the real credentials to run locally.

1. Copy the `.env.example` into a local env file

```
cd web/
cp .env.example .env
```

**Note:** You may also have to overwrite the `.env.local` file if one exists. The `.env.example` file contains all the environment variables needed to run locally with placeholder values for secrets.

2. Edit any environment variables for which you have real credentials.
3. AWS access is required to run the Developer Portal locally. The following AWS services are used:
   - **KMS** - for signing/encryption (Sign in with World ID, RP Registry)
   - **SSM Parameter Store** - for feature flags (e.g., World ID 4.0 enabled teams)
   - **S3** - for asset storage

   **For Worldcoin team members:** Use the `worldcoin-consumer-stage` AWS profile:
   ```bash
   export AWS_PROFILE=worldcoin-consumer-stage
   ```

   Or run the app with the profile:
   ```bash
   AWS_PROFILE=worldcoin-consumer-stage pnpm dev
   ```

   **For external contributors:** You will need AWS credentials with relevant permissions. Here is an [IAM sample policy](web/aws-role-sample-policy.json) for this.

   If you are a core contributor with AWS access to TFH, follow the instructions [here](https://github.com/worldcoin/developer-portal-deployment#local-development) instead.

### Local image uploads with LocalStack

You can upload images locally without an AWS account or installing the LocalStack/AWS CLI on your machine. The `awslocal` commands below run inside the container. In the same `web/.env` from step 1, set:

```dotenv
LOCALSTACK_AUTH_TOKEN=<auth-token>
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
ASSETS_S3_REGION=us-east-1
ASSETS_S3_BUCKET_NAME=developer-portal-assets
```

`AWS_ENDPOINT_URL_S3` is already set to the LocalStack endpoint by `.env.example`, so it is copied into `.env` automatically. `LOCALSTACK_AUTH_TOKEN` comes from the [LocalStack auth token page](https://docs.localstack.cloud/aws/getting-started/auth-token/). The `test` values are dummy credentials accepted by LocalStack, not real AWS credentials. Never commit your personal token.

Start LocalStack, then create the bucket and its browser CORS policy once:

```bash
docker compose --profile localstack up --detach --wait localstack
docker compose --profile localstack exec localstack \
  awslocal s3api create-bucket --bucket developer-portal-assets
docker compose --profile localstack exec localstack \
  awslocal s3api put-bucket-cors \
  --bucket developer-portal-assets \
  --cors-configuration \
  '{"CORSRules":[{"AllowedOrigins":["http://localhost:3000"],"AllowedMethods":["GET","HEAD","POST"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"]}]}'
```

Run `cd web && pnpm dev`, then image uploads from `http://localhost:3000` use LocalStack. Check the service with `docker compose --profile localstack ps localstack`; stop it with `docker compose --profile localstack stop localstack`.

### Starting the app

The following command will start two containers with the Postgres database, and Hasura server. Additionally, it will run the Next.js app from the [/web](./web) directory. All Hasura migrations and metadata are automatically applied.

```bash
docker compose up --detach
cd web && pnpm dev
```

You can also take advantage of the Makefile, `make up`

### Running end-to-end tests

End-to-end tests require Docker containers from previous block (Hasura & Postgres) to be running. You can start web app as well, but Playwright can start it for you automatically, if it won't find the app running on its default port.

> [!IMPORTANT]  
> Make sure you set up required credentials in `.env` -- you can find some of them in our shared password vault.

Install browsers for end-to-end tests runs if you run tests for the first time or haven't ran them for a long time:

```bash
cd web && npx playwright install
```

> [!NOTE]  
> These binaries are different than those executables and/or installation packages that you download the regular way. They are being stored in [**Playwright** cache folder](https://playwright.dev/docs/browsers#managing-browser-binaries).

Run tests:

```bash
cd web && pnpm test:e2e
```

It's also recommended to use **Playwright** extension in **Visual Studio Code** if you debug or develop new tests. This extension helps you run individual tests or test groups and launch a debug mode with stops on breakpoints.

### Updating Database Model

If you need to update anything related to the database (model, permissions, events, etc.) the easiest way is with the Hasura console.

1. Follow instructions to install the [Hasura CLI](https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli/).
2. Launch the Hasura console.

   ```bash
   cd hasura
   hasura console --endpoint http://localhost:8080 --admin-secret secret!
   ```

   You can also take advantage of the Makefile, `make hasura-console`

> **Warning** Make sure to only make the changes in the Hasura console (usually `http://localhost:9665`), if you make changes on `http://localhost:8080`the migrations will not be generated and your changes will be lost.

> 💡 The admin secret in stored in `docker-compose.yml` file in the root of the repo.
