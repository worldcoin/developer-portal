import "server-only";

export type AppStoreConnectConfig = {
  keyId: string;
  issuerId: string;
  privateKey: string;
  betaGroupId: string;
};

export class AppStoreConnectConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppStoreConnectConfigurationError";
  }
}

const REQUIRED_ENV_KEYS = [
  "APP_STORE_CONNECT_API_KEY_ID",
  "APP_STORE_CONNECT_ISSUER_ID",
  "APP_STORE_CONNECT_API_KEY_CONTENT",
  "APP_STORE_CONNECT_BETA_GROUP_ID",
] as const;

/** Reads and validates server-only App Store Connect configuration. */
export const getAppStoreConnectConfig = (
  env: NodeJS.ProcessEnv = process.env,
): AppStoreConnectConfig => {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]?.trim());
  if (missingKeys.length > 0) {
    throw new AppStoreConnectConfigurationError(
      `Missing App Store Connect configuration: ${missingKeys.join(", ")}`,
    );
  }

  const privateKey = env
    .APP_STORE_CONNECT_API_KEY_CONTENT!.replace(/\\n/g, "\n")
    .trim();
  if (
    !privateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new AppStoreConnectConfigurationError(
      "APP_STORE_CONNECT_API_KEY_CONTENT must be a PKCS#8 PEM private key",
    );
  }

  return {
    keyId: env.APP_STORE_CONNECT_API_KEY_ID!.trim(),
    issuerId: env.APP_STORE_CONNECT_ISSUER_ID!.trim(),
    privateKey,
    betaGroupId: env.APP_STORE_CONNECT_BETA_GROUP_ID!.trim(),
  };
};
