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
  "ASC_KEY_ID",
  "ASC_ISSUER_ID",
  "ASC_PRIVATE_KEY",
  "ASC_BETA_GROUP_ID",
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

  const privateKey = env.ASC_PRIVATE_KEY!.replace(/\\n/g, "\n").trim();
  if (
    !privateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new AppStoreConnectConfigurationError(
      "ASC_PRIVATE_KEY must be a PKCS#8 PEM private key",
    );
  }

  return {
    keyId: env.ASC_KEY_ID!.trim(),
    issuerId: env.ASC_ISSUER_ID!.trim(),
    privateKey,
    betaGroupId: env.ASC_BETA_GROUP_ID!.trim(),
  };
};
