import "server-only";

/**
 * Contains all backend utilities related to JWTs.
 * * OIDC tokens
 * * Hasura authentication
 * * Developer Portal authentication
 */
import { retrieveJWK } from "@/api/helpers/jwks";
import { getKMSClient, signJWTWithKMSKey } from "@/api/helpers/kms";
import { OIDCScopes } from "@/api/helpers/oidc";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import * as jose from "jose";

export interface JwtConfig {
  key: string;
  type: "HS512" | "HS384" | "HS256";
}

export const JWT_ISSUER = process.env.JWT_ISSUER;
const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
const HASURA_GRAPHQL_JWT_SECRET: JwtConfig = JSON.parse(
  process.env.HASURA_GRAPHQL_JWT_SECRET || "",
);

if (!JWT_ISSUER) {
  throw new Error("Improperly configured. `JWT_ISSUER` env var must be set!");
}

if (!HASURA_GRAPHQL_JWT_SECRET) {
  throw "Improperly configured. `HASURA_GRAPHQL_JWT_SECRET` env var must be set!";
}

if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!",
  );
}

/**
 * Generates a Hasura-valid JWT for a specific user.
 */
export const _generateJWT = async (
  payload: Record<string, any>,
  expiration: string | number = "1m",
  key: string = HASURA_GRAPHQL_JWT_SECRET.key,
): Promise<string> => {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: HASURA_GRAPHQL_JWT_SECRET.type })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(expiration)
    .sign(new Uint8Array(Buffer.from(key)));

  return token;
};

export const getUserJWTPayload = (user_id: string) => ({
  sub: user_id,
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["user"],
    "x-hasura-default-role": "user",
    "x-hasura-user-id": user_id,
  },
});

/**
 * Generates a JWT for a specific user.
 * @param user_id
 * @param team_id
 * @returns
 */
export const generateUserJWT = async (
  user_id: string,
  expiration: number = dayjs().add(1, "minute").unix(),
) => {
  const payload = getUserJWTPayload(user_id);
  const token = await _generateJWT(payload, expiration);

  return { token, expiration };
};

/**
 * Verifies a user JWT.
 * @param user_id
 * @param team_id
 * @returns
 */
export const verifyUserJWT = async (token: string) => {
  try {
    await jose.jwtVerify(
      token,
      new Uint8Array(Buffer.from(HASURA_GRAPHQL_JWT_SECRET.key)),
      {
        issuer: JWT_ISSUER,
      },
    );
  } catch {
    return false;
  }

  return true;
};

// ANCHOR: -----------------HASURA JWTs--------------------------

/**
 * Generates a 1-min JWT for the `service` role (only for internal use from Next.js API)
 * @returns
 */
export const generateServiceJWT = async (): Promise<string> => {
  const payload = {
    sub: "service_account",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["service"],
      "x-hasura-default-role": "service",
    },
  };

  return await _generateJWT(payload, "1m");
};

/**
 * Generates a 1-min JWT for the `reviewer` role (only for internal use from Next.js API)
 * @returns
 */
export const generateReviewerJWT = async (): Promise<string> => {
  const payload = {
    sub: "reviewer_account",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["reviewer"],
      "x-hasura-default-role": "reviewer",
    },
  };

  return await _generateJWT(payload, "1m");
};

/**
 * Generates a JWT for a specific API key.
 * @param team_id
 * @returns
 */
export const generateAPIKeyJWT = async (team_id: string): Promise<string> => {
  const payload = {
    sub: team_id,
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["api_key"],
      "x-hasura-default-role": "api_key",
      "x-hasura-team-id": team_id,
    },
  };

  return await _generateJWT(payload, "1m");
};

/**
 * Generates a JWT for the analytics service.
 * @returns
 */
export const generateAnalyticsJWT = async (): Promise<string> => {
  const payload = {
    sub: "analytics_service",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["analytics"],
      "x-hasura-default-role": "analytics",
    },
  };

  return await _generateJWT(payload, "1m");
};

// ANCHOR: -----------------Sign up JWTs--------------------------

/**
 * Generates a temporary JWT used to sign up a user.
 * After a user logs in with World ID if they don't have an account, we generate this temporary token. If they complete account creation, we exchange this token.
 * @param nullifier_hash
 * @returns
 */
export const generateSignUpJWT = async (nullifier_hash: string) => {
  const payload = {
    sub: nullifier_hash,
  };

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS512" })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime("1h")
    .sign(new Uint8Array(Buffer.from(GENERAL_SECRET_KEY)));

  return token;
};

/**
 * Verifies a sign up token. Returns the nullifier hash. If the token is invalid, throws an error.
 * @param token
 */
export const verifySignUpJWT = async (token: string) => {
  const { payload } = await jose.jwtVerify(
    token,
    new Uint8Array(Buffer.from(GENERAL_SECRET_KEY)),
    {
      issuer: JWT_ISSUER,
    },
  );
  const { sub } = payload;
  if (!sub) {
    throw new Error("JWT does not contain valid `sub` claim.");
  }
  return { sub };
};

// ANCHOR: -----------------OIDC JWTs--------------------------

const formatOIDCDateTime = (date: Date | dayjs.Dayjs): number => {
  return dayjs(date).unix();
};

interface IVerificationJWT {
  kid: string;
  kms_id: string;
  nonce?: string;
  nullifier_hash: string;
  app_id: string;
  verification_level: VerificationLevel;
  scope: OIDCScopes[];
}

/**
 * Generates a JWT that can be used to verify a proof (used for Sign in with World ID)
 * @returns
 */
export const generateOIDCJWT = async ({
  app_id,
  nonce,
  nullifier_hash,
  kid,
  verification_level,
  scope,
}: IVerificationJWT): Promise<string> => {
  const payload = {
    iss: JWT_ISSUER,
    sub: nullifier_hash,
    jti: randomUUID(),
    iat: formatOIDCDateTime(new Date()),
    exp: formatOIDCDateTime(dayjs().add(1, "hour")),
    aud: app_id,
    scope: scope.join(" "),
    // NOTE: DEPRECATED, will be removed in future versions
    "https://id.worldcoin.org/beta": {
      likely_human:
        verification_level === VerificationLevel.Orb ? "strong" : "weak",
      credential_type: verification_level,
      warning:
        "DEPRECATED and will be removed soon. Use `https://id.worldcoin.org/v1` instead.",
    },
    "https://id.worldcoin.org/v1": {
      verification_level,
    },
  } as Record<string, any>;

  if (nonce) {
    payload.nonce = nonce;
  }

  if (scope.includes(OIDCScopes.Email)) {
    payload.email = `${nullifier_hash}@id.worldcoin.org`;
  }

  if (scope.includes(OIDCScopes.Profile)) {
    payload.name = "World ID User";
    payload.given_name = "World ID";
    payload.family_name = "User";
  }

  // Sign the JWT with a KMS managed key
  const client = await getKMSClient();
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid,
  };

  if (client) {
    const token = await signJWTWithKMSKey(client, header, payload);
    if (token) return token;
  }
  throw new Error("Failed to sign JWT from KMS.");
};

export const verifyOIDCJWT = async (
  token: string,
): Promise<jose.JWTPayload> => {
  const { kid } = jose.decodeProtectedHeader(token);

  if (!kid) {
    throw new Error("JWT is invalid. Does not contain a `kid` claim.");
  }

  const { public_jwk } = await retrieveJWK(kid);

  if (!public_jwk) {
    throw new Error("Key for this JWT is invalid.");
  }

  const { payload } = await jose.jwtVerify(
    token,
    await jose.importJWK(public_jwk, "RS256"),
    {
      issuer: JWT_ISSUER,
    },
  );

  return payload;
};
