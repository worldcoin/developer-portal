<img src="dev-portal-logo.png" alt="Developer Portal logo" width="360" />

# Developer Portal

The Worldcoin Developer Portal provides tools to interact with the Worldcoin SDK. Easiest way to get started with World ID.

<!-- WORLD-ID-SHARED-README-TAG:START - Do not remove or modify this section directly -->
<!-- The contents of this file are inserted to all World ID repositories to provide general context on World ID. -->

## <img align="left" width="28" height="28" src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-orb.png" alt="" style="margin-right: 0;" /> About World ID

World ID is a protocol that lets you **prove a human is doing an action only once without revealing any personal data**. Stop bots, stop abuse.

World ID uses a device called the [Orb](https://worldcoin.org/how-the-launch-works) which takes a picture of a person's iris to verify they are a unique and alive human. The protocol uses [Zero-knowledge proofs](https://id.worldcoin.org/zkp) so no traceable information is ever public.

World ID is meant for on-chain web3 apps, traditional cloud applications, and even IRL verifications.

<img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-diagram.png" alt="Diagram of how World ID works."  />

### Getting started with World ID

Regardless of how you landed here, the easiest way to get started with World ID is through the the [Dev Portal](https://developer.worldcoin.org).

<a href="https://developer.worldcoin.org">
<p align="center">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-get-started.png" alt="Get started" height="50" />
</p>
</a>

### World ID Demos

Want to see World ID in action? We have a bunch of [Examples](https://id.worldcoin.org/examples).

<a href="https://id.worldcoin.org/examples">
<p align="center">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-examples.png" alt="Click here to see examples" height="150" />
</p>
</a>

## 📄 Documentation

We have comprehensive docs for World ID at https://id.worldcoin.org/docs.

<a href="https://id.worldcoin.org/docs">
<p align="center">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-docs.png" alt="Visit documentation" height="50" />
</p>
</a>

## 🗣 Feedback

**World ID is in Beta, help us improve!** Please share feedback on your experience. You can find us on [Discord](https://discord.gg/worldcoin), look for the [#world-id](https://discord.com/channels/956750052771127337/968523914638688306) channel. You can also open an issue or a PR directly on this repo.

<a href="https://discord.gg/worldcoin">
<p align="center">
  <img src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/static/img/readme-discord.png" alt="Join Discord" height="50" />
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
