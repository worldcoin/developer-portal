/**
 * Contains all functions for interacting with Amazon KMS
 */

import {
  CreateKeyCommand,
  GetPublicKeyCommand,
  KMSClient,
} from "@aws-sdk/client-kms";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";

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

export const createKMSKey = async (kmsClient: KMSClient, alg: string) => {
  try {
    const createKeyResponse = await kmsClient.send(
      new CreateKeyCommand({
        KeySpec: "RSA_2048",
        KeyUsage: "SIGN_VERIFY",
        Description: `Dev Portal KMS Key for ${new Date().toISOString()}`,
      })
    );

    if (createKeyResponse.KeyMetadata) {
      const keyId = createKeyResponse.KeyMetadata.KeyId;
      const publicKeyResponse = await kmsClient.send(
        new GetPublicKeyCommand({ KeyId: keyId })
      );

      if (publicKeyResponse.PublicKey) {
        return `-----BEGIN PUBLIC KEY-----
${Buffer.from(publicKeyResponse.PublicKey).toString("base64")}
-----END PUBLIC KEY-----`;
      }
    }
  } catch (error) {
    console.error("Error creating key:", error);
  }
};
