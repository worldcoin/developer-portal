/**
 * Contains all functions for interacting with Amazon KMS
 */

import {
  CreateKeyCommand,
  DescribeKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
  SignCommand,
} from "@aws-sdk/client-kms";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { base64url } from "jose";

const kmsKeyPolicy = `{
  "Version": "2012-10-17",
  "Id": "key-default-1",
  "Statement": [
    {
      "Sid": "AllowAccessUntilExpirationDate",
      "Effect": "Allow",
      "Principal": {
        "AWS": ${process.env.AWS_KMS_ROLE_ARN}
      },
      "Action": [
        "kms:CreateKey",
        "kms:DescribeKey",
        "kms:PutKeyPolicy",
        "kms:GetPublicKey",
        "kms:Sign",
        "kms:Verify"
      ],
      "Resource": "*",
      "Condition": {
        "DateLessThan": {
          "aws:CurrentTime": "${new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString()}"
        }
      }
    }
  ]
}`;

export type CreateKeyResult =
  | {
      keyId: string;
      publicKey: string;
    }
  | undefined;

export const getKMSClient = async () => {
  const stsClient = new STSClient({ region: process.env.AWS_REGION_NAME });

  try {
    const response = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: process.env.AWS_KMS_ROLE_ARN,
        RoleSessionName: "DevPortalKmsSession",
        DurationSeconds: 3600, // 1 hour
      })
    );

    if (response.Credentials) {
      const roleCredentials = {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken,
      };

      const kmsClient = new KMSClient({
        region: process.env.AWS_REGION_NAME,
        credentials: roleCredentials,
      });

      return kmsClient;
    }
  } catch (error) {
    console.error("Error assuming role:", error);
  }
};

export const createKMSKey = async (
  kmsClient: KMSClient,
  alg: string
): Promise<CreateKeyResult> => {
  try {
    const createKeyResponse = await kmsClient.send(
      new CreateKeyCommand({
        KeySpec: alg,
        KeyUsage: "SIGN_VERIFY",
        Description: `Developer Portal JWK for Sign in with Worldcoin. Created: ${new Date().toISOString()}`,
        Policy: kmsKeyPolicy,
      })
    );

    if (createKeyResponse.KeyMetadata) {
      const keyId = createKeyResponse.KeyMetadata.KeyId;
      const publicKeyResponse = await kmsClient.send(
        new GetPublicKeyCommand({ KeyId: keyId })
      );

      if (keyId && publicKeyResponse.PublicKey) {
        const publicKey = `-----BEGIN PUBLIC KEY-----
${Buffer.from(publicKeyResponse.PublicKey).toString("base64")}
-----END PUBLIC KEY-----`;

        return { keyId, publicKey };
      }
    }
  } catch (error) {
    console.error("Error creating key:", error);
  }
};

export const getKMSKeyStatus = async (kmsClient: KMSClient, keyId: string) => {
  try {
    const response = await kmsClient.send(
      new DescribeKeyCommand({
        KeyId: keyId,
      })
    );

    if (response.KeyMetadata) {
      return response.KeyMetadata.Enabled;
    }
  } catch (error) {
    console.error("Error describing key:", error);
  }
};

export const signJWTWithKMSKey = async (
  kmsClient: KMSClient,
  keyId: string,
  payload: Record<string, any>
) => {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const encodedHeader = base64url.encode(JSON.stringify(header));
  const encodedPayload = base64url.encode(JSON.stringify(payload));
  const encodedHeaderPayload = `${encodedHeader}.${encodedPayload}`;

  try {
    const response = await kmsClient.send(
      new SignCommand({
        KeyId: keyId,
        Message: Buffer.from(encodedHeaderPayload, "utf8"),
        MessageType: "RAW",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      })
    );

    if (response?.Signature) {
      const encodedSignature = base64url.encode(
        Buffer.from(response.Signature.buffer as ArrayBuffer)
      );
      const jwt = `${encodedHeaderPayload}.${encodedSignature}`;
      return jwt;
    }
  } catch (error) {
    console.error("Error signing JWT:", error);
  }
};
