<a href="https://developer.world.org">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-header.png" alt="" />
</a>

# Developer Portal

The World Developer Portal provides tools to interact with the [World ID Protocol](https://world.org/world-id). Along with [IDKit](https://github.com/worldcoin/idkit-js), it's the fastest way to get started with proof of personhood 🚀

## 📄 Documentation

All the technical docs for the World SDK, World ID Protocol, examples, guides can be found at https://docs.world.org/

## 📋 Prerequisites

1. **Node.js v20.18.0** - You can install it using [nvm](https://github.com/nvm-sh/nvm) (recommended) or directly from [nodejs.org](https://nodejs.org/).
   - If using nvm, you can install it via Homebrew (`brew install nvm`) or follow the [nvm installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating). Then run:
     ```bash
     nvm install
     nvm use
     ```
   - Alternatively, install Node.js v20.18.0 directly from [nodejs.org](https://nodejs.org/).

2. **pnpm** (version >= 8.15.8):
   ```bash
   npm install -g pnpm
   ```

3. **Docker** and **Docker Compose** - Install from the [official Docker website](https://www.docker.com/get-started) (Docker Desktop includes both Docker and Docker Compose).
   - **Note for Apple Silicon users:** You may be prompted to install Rosetta 2 during Docker installation. This is required for compatibility with some Docker images or installer components. Rosetta 2 can be installed automatically when prompted, or manually via `softwareupdate --install-rosetta` in Terminal.

## 🧑‍💻 Developing Locally

The Developer Portal uses some external services to operate. You do **not** need all the real credentials to run locally.

1. Copy the `.env.test` into a local env file

```
cd web/
cp .env.test .env
```

**Note:** You may also have to overwrite the `.env.local` file if one exists.

2. Edit any environment variables for which you have real credentials.
3. AWS access (for KMS) is required to run the Developer Portal locally. KMS is used to sign/encrypt, particularly for Sign in with World ID. You will need to have AWS credentials in your env with relevant permissions to run KMS. Here is an [IAM sample policy](web/aws-role-sample-policy.json) for this.
   1. If you are a core contributor with AWS access to TFH, follow the instructions [here](https://github.com/worldcoin/developer-portal-deployment#local-development) instead.

### Starting the app

The following commands will start two containers with the Postgres database, and Hasura server. Additionally, it will run the Next.js app from the [/web](./web) directory. All Hasura migrations and metadata are automatically applied.

```bash
# Start Docker containers (run from project root)
docker compose up --detach

# Install dependencies (run from project root)
cd web && pnpm install

# Start the Next.js dev server
pnpm dev
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
