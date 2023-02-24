/**
 * Contains all backend utilities related to JWTs.
 * * OIDC tokens
 * * Hasura authentication
 * * Developer Portal authentication
 */
import { randomUUID } from "crypto";
import * as jose from "jose";
import { CredentialType, JwtConfig } from "../types";
import { JWK_ALG } from "consts";
import { retrieveJWK } from "./jwks";

const JWT_ISSUER = process.env.JWT_ISSUER;
const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
const JWT_CONFIG: JwtConfig = JSON.parse(
  process.env.HASURA_GRAPHQL_JWT_SECRET || ""
);

if (!JWT_ISSUER) {
  throw new Error("Improperly configured. `JWT_ISSUER` env var must be set!");
}

if (!JWT_CONFIG) {
  throw "Improperly configured. `HASURA_GRAPHQL_JWT_SECRET` env var must be set!";
}

if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!"
  );
}

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

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.type })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime("1m")
    .sign(Buffer.from(JWT_CONFIG.key));

  return token;
};

/**
 * Generates a JWT for a specific user.
 */
const _generateJWT = async (
  payload: Record<string, any>,
  expiration: string = "24h"
): Promise<string> => {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.type })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(expiration)
    .sign(Buffer.from(JWT_CONFIG.key));

  return token;
};

/**
 * Generates a JWT for a specific user.
 * @param user_id
 * @param team_id
 * @returns
 */
export const generateUserJWT = async (
  user_id: string,
  team_id: string
): Promise<string> => {
  const payload = {
    sub: user_id,
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["user"],
      "x-hasura-default-role": "user",
      "x-hasura-user-id": user_id,
      "x-hasura-team-id": team_id,
    },
  };

  return await _generateJWT(payload);
};

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
    .sign(Buffer.from(GENERAL_SECRET_KEY));

  return token;
};

/**
 * Verifies a sign up token. Returns the nullifier hash. If the token is invalid, throws an error.
 * @param token
 */
export const verifySignUpJWT = async (token: string): Promise<string> => {
  const { payload } = await jose.jwtVerify(
    token,
    Buffer.from(GENERAL_SECRET_KEY),
    {
      issuer: JWT_ISSUER,
    }
  );
  const { sub } = payload;
  if (!sub) {
    throw new Error("JWT does not contain valid `sub` claim.");
  }
  return sub;
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

  return await _generateJWT(payload);
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

  return await _generateJWT(payload);
};

/**
 * Generates an asymmetric key pair in JWK format
 * @returns
 */
export const generateJWK = async (): Promise<{
  privateJwk: jose.JWK;
  publicJwk: jose.JWK;
}> => {
  const { publicKey, privateKey } = await jose.generateKeyPair(JWK_ALG);

  const privateJwk = await jose.exportJWK(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);

  return { privateJwk, publicJwk };
};

interface IVerificationJWT {
  privateJwk: jose.JWK;
  kid: string;
  nonce: string;
  nullifier_hash: string;
  app_id: string;
  credential_type: CredentialType;
}

/**
 * Generates a JWT that can be used to verify a proof (used for Sign in with World ID)
 * @returns
 */
export const generateOIDCJWT = async ({
  app_id,
  nonce,
  nullifier_hash,
  privateJwk,
  kid,
  credential_type,
}: IVerificationJWT): Promise<string> => {
  const payload = {
    nonce,
    sub: nullifier_hash,
    jti: randomUUID(),
    aud: app_id,
    "https://id.worldcoin.org/beta": {
      likely_human: credential_type === CredentialType.Orb ? "strong" : "weak",
      credential_type,
    },
  };

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWK_ALG, kid })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime("1h")
    .sign(await jose.importJWK(privateJwk, JWK_ALG));
};

export const verifyOIDCJWT = async (token: string) => {
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
    await jose.importJWK(public_jwk, JWK_ALG),
    {
      issuer: JWT_ISSUER,
    }
  );

  return payload;
};
