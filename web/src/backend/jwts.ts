/**
 * Contains all backend utilities related to JWTs.
 * * OIDC tokens
 * * Hasura authentication
 * * Developer Portal authentication
 */
import { randomUUID } from "crypto";
import * as jose from "jose";
import { CredentialType, JwtConfig } from "../lib/types";
import { JWK_ALG_OIDC } from "src/lib/constants";
import { retrieveJWK } from "./jwks";
import { OIDCScopes } from "./oidc";
import dayjs from "dayjs";

export const JWT_ISSUER = process.env.JWT_ISSUER;
const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
const HASURA_GRAPHQL_JWT_SECRET: JwtConfig = JSON.parse(
  process.env.HASURA_GRAPHQL_JWT_SECRET || ""
);

if (!JWT_ISSUER) {
  throw new Error("Improperly configured. `JWT_ISSUER` env var must be set!");
}

if (!HASURA_GRAPHQL_JWT_SECRET) {
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
    .setProtectedHeader({ alg: HASURA_GRAPHQL_JWT_SECRET.type })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime("1m")
    .sign(Buffer.from(HASURA_GRAPHQL_JWT_SECRET.key));

  return token;
};

/**
 * Generates a Hasura-valid JWT for a specific user.
 */
export const _generateJWT = async (
  payload: Record<string, any>,
  expiration: string | number = "1h",
  key: string = HASURA_GRAPHQL_JWT_SECRET.key
): Promise<string> => {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: HASURA_GRAPHQL_JWT_SECRET.type })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(expiration)
    .sign(Buffer.from(key));

  return token;
};

export const getUserJWTPayload = (user_id: string, team_id: string) => ({
  sub: user_id,
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["user"],
    "x-hasura-default-role": "user",
    "x-hasura-user-id": user_id,
    "x-hasura-team-id": team_id,
  },
});

/**
 * Generates a JWT for a specific user.
 * @param user_id
 * @param team_id
 * @returns
 */
export const generateUserJWT = async (user_id: string, team_id: string) => {
  const payload = getUserJWTPayload(user_id, team_id);

  const expiration = dayjs().add(7, "day").unix();
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
    await jose.jwtVerify(token, Buffer.from(HASURA_GRAPHQL_JWT_SECRET.key), {
      issuer: JWT_ISSUER,
    });
  } catch {
    return false;
  }

  return true;
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
export const verifySignUpJWT = async (token: string) => {
  const { payload } = await jose.jwtVerify(
    token,
    Buffer.from(GENERAL_SECRET_KEY),
    {
      issuer: JWT_ISSUER,
    }
  );
  const { sub, waitlist_invite } = payload;
  if (!sub) {
    throw new Error("JWT does not contain valid `sub` claim.");
  }
  return { sub, waitlist_invite };
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

interface IVerificationJWT {
  private_jwk: jose.JWK;
  kid: string;
  nonce?: string;
  nullifier_hash: string;
  app_id: string;
  credential_type: CredentialType;
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
  private_jwk,
  kid,
  credential_type,
  scope,
}: IVerificationJWT): Promise<string> => {
  const payload = {
    sub: nullifier_hash,
    jti: randomUUID(),
    iat: new Date().getTime(),
    aud: app_id,
    scope: scope.join(" "),
    "https://id.worldcoin.org/beta": {
      likely_human: credential_type === CredentialType.Orb ? "strong" : "weak",
      credential_type,
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

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWK_ALG_OIDC, kid })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime("1h")
    .sign(await jose.importJWK(private_jwk, JWK_ALG_OIDC));
};

export const verifyOIDCJWT = async (
  token: string
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
    await jose.importJWK(public_jwk, JWK_ALG_OIDC),
    {
      issuer: JWT_ISSUER,
    }
  );

  return payload;
};
