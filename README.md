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

The Developer Portal uses several external services to operate. Credentials for each of these services can be placed in the [.env.test](./web/.env.test) or .env.local file. These include:

- [Alchemy API](https://docs.alchemy.com/reference/api-overview)
- [Worldcoin Signup Sequencer](https://github.com/worldcoin/signup-sequencer)
- [AWS Key Management Service](https://aws.amazon.com/kms/)

### KMS Setup

To start using the JWKS features of the portal, some prior setup in your AWS account is required. Specifically, an IAM role needs to be provisioned with the following policies attached:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "kms:GetPublicKey",
        "kms:TagResource",
        "kms:ScheduleKeyDeletion",
        "kms:PutKeyPolicy",
        "kms:DescribeKey",
        "kms:Verify",
        "kms:Sign"
      ],
      "Resource": "arn:aws:kms:*:<ACCOUNT_NUMBER>:key/*"
    },
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": "kms:CreateKey",
      "Resource": "*"
    }
  ]
}
```

Then, generate an access key to the role, and add the below details to the `.env` file:

```txt
AWS_REGION_NAME=<REGION_NAME>
AWS_ACCESS_KEY_ID=<ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<ACCESS_KEY_SECRET>
TASK_ROLE_ARN=<IAM_ROLE_ARN>
```

### Dev Login

To bypass the KMS requirement, the codebase contains conditional logic to allow developers to login when running locally. This feature is dependent on the following HS512 JWT keys matching each other:

- `NEXT_PUBLIC_DEV_LOGIN_KEY` ([.env](./web/.env.test))
- `HASURA_GRAPHQL_JWT_SECRET` ([.env](./web/.env.test))
- `HASURA_GRAPHQL_JWT_SECRET` ([docker-compose.yaml](./docker-compose.yaml))

If you have issues, please double check these values before debugging further.

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
