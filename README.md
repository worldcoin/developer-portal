<a href="https://developer.worldcoin.org">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-header.png" alt="" />
</a>

# Developer Portal

The Worldcoin Developer Portal provides tools to interact with the [World ID Protocol](https://worldcoin.org/world-id). Along with [IDKit](https://github.com/worldcoin/idkit-js), it's the fastest way to get started with proof of personhood 🚀

<!-- WORLD-ID-SHARED-README-TAG:START - Do not remove or modify this section directly -->
<!-- The contents of this file are inserted to all World ID repositories to provide general context on World ID. -->

## <img align="left" width="28" height="28" src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-world-id.png" alt="" style="margin-right: 0; padding-right: 4px;" /> About World ID

World ID is the privacy-first identity protocol that brings global proof of personhood to the internet. More on World ID in the [announcement blog post](https://worldcoin.org/blog/announcements/introducing-world-id-and-sdk).

World ID lets you seamlessly integrate authentication into your app that verifies accounts belong to real persons through [Sign in with Worldcoin](https://docs.worldcoin.org/id/sign-in). For additional flexibility and cases where you need extreme privacy, [Anonymous Actions](https://docs.worldcoin.org/id/anonymous-actions) lets you verify users in a way that cannot be tracked across verifications.

Follow the [Quick Start](https://docs.worldcoin.org/quick-start) guide for the easiest way to get started.

## 📄 Documentation

All the technical docs for the Worldcoin SDK, World ID Protocol, examples, guides can be found at https://docs.worldcoin.org/

<a href="https://docs.worldcoin.org">
  <p align="center">
    <picture align="center">
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/visit-documentation-dark.png" height="50px" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/visit-documentation-light.png" height="50px" />
      <img />
    </picture>
  </p>
</a>

<!-- WORLD-ID-SHARED-README-TAG:END -->

## 🧑‍💻 Developing Locally

The Developer Portal uses some external services to operate. You do **not** need all the real credentials to run locally.

1. Copy the `.env.test` into a local env file

```
cd web/
cp .env.test .env
```

2. Edit any environment variables for which you have real credentials.
3. AWS access (for KMS) is required to run the Developer Portal locally. KMS is used to sign/encrypt, particularly for Sign in with Worldcoin. You will need to have AWS credentials in your env with relevant permissions to run KMS. Here is an [IAM sample policy](aws-role-sample-policy.json) for this.
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
