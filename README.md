<img src="dev-portal-logo.png" alt="Developer Portal logo" width="360" />

# Developer Portal

The Worldcoin Developer Portal provides tools to interact with the Worldcoin SDK. Easiest way to get started with World ID.

<!-- WORLD-ID-SHARED-README-TAG:START - Do not remove or modify this section directly -->
<!-- The contents of this file are inserted to all World ID repositories to provide general context on World ID. -->

## <img align="left" width="28" height="28" src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-world-id.png" alt="" style="margin-right: 0; padding-right: 4px;" /> About World ID

World ID is the privacy-first identity protocol that brings global proof of personhood to the internet. More on World ID in the [announcement blog post](https://worldcoin.org/blog/announcements/introducing-world-id-and-sdk).

World ID lets you seamlessly integrate authentication into your app that verifies accounts belong to real persons through [Sign in with Worldcoin](https://docs.worldcoin.org/id/sign-in). For additional flexibility and cases where you need extreme privacy, [Anonymous Actions](https://docs.worldcoin.org/id/anonymous-actions) lets you verify users in a way that cannot be tracked across verifications.

Follow the [Quick Start](https://docs.worldcoin.org/quick-start) guide for the easiest way to get started.

## 📄 Documentation

All the technical docs for the Wordcoin SDK, World ID Protocol, examples, guides can be found at https://docs.worldcoin.org/

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

## 🧑‍💻 Development & testing

The following command will start the DB, the Hasura server and the Next.js app. It will also automatically apply Hasura migrations and metadata.

```bash
docker compose up -d --abort-on-container-exit
cd web && yarn dev
```

### Updating DB model & permissions

If you will update anything related to Hasura (database model, permissions, etc.) the easiest way is with the Hasura console.

1. Follow instructions to install the [Hasura CLI](https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli/).
2. Launch the Hasura console.
   ```bash
   cd hasura
   hasura console --endpoint http://localhost:8080 --admin-secret secret!
   ```

> **Warning** Make sure to only make the changes in the Hasura console (usually `http://localhost:9665`), if you make changes on `http://localhost:8080`the migrations will not be generated and your changes will be lost.

> 💡 The admin secret in stored in `docker-compose.yml` file in the root of the repo.
