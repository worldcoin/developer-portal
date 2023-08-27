/**
 * Contains all backend utilities related to JWTs.
 * * OIDC tokens
 * * Hasura authentication
 * * Developer Portal authentication
 */
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import * as jose from "jose";
import { CredentialType, JwtConfig } from "../lib/types";
import { retrieveJWK } from "./jwks";
import { getKMSClient, signJWTWithKMSKey } from "./kms";
import { OIDCScopes } from "./oidc";
import * as yup from "yup";

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
  credential_type: CredentialType;
  scope: OIDCScopes[];
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

export const generateAccessToken = async ({
  kid,
  app_id,
  nullifier_hash,
  scope,
}: IVerificationJWT) => {
  const payloadSchema = yup.object({
    iss: yup
      .string()
      .strict()
      .oneOf(["https://developer.worldcoin.org"])
      .required(),

    aud: yup.string().strict().required(),
    sub: yup.string().strict().required(),
    exp: yup.number().required(),
    iat: yup.number().required(),
    jti: yup.string().strict().required(),
    scope: yup.string().strict().required(),
  });

  let payload: yup.InferType<typeof payloadSchema> | null = null;

  try {
    payload = await payloadSchema.validate({
      iss: JWT_ISSUER,
      sub: nullifier_hash,
      jti: randomUUID(),
      iat: formatOIDCDateTime(new Date()),
      exp: formatOIDCDateTime(dayjs().add(1, "hour")),
      aud: app_id,
      scope: scope.join(" "),
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Invalid payload: ${error.message}`);
    }

    throw error;
  }

  if (!payload) {
    throw new Error("Payload is null");
  }

  const header = {
    typ: "application/token+jwt",
    alg: "RS256",
    kid,
  };

  // Sign the JWT with a KMS managed key
  const client = await getKMSClient();

  if (client) {
    const token = await signJWTWithKMSKey(client, header, payload);
    if (token) return token;
  }

  throw new Error("Failed to sign JWT from KMS.");
};

export const generateIdToken = async ({
  kid,
  app_id,
  nonce,
  nullifier_hash,
  credential_type,
  scope,
  email,
  name,
  given_name,
  family_name,
}: IVerificationJWT) => {
  const payloadSchema = yup.object({
    iss: yup
      .string()
      .strict()
      .oneOf(["https://developer.worldcoin.org"])
      .required(),

    aud: yup.string().strict().required(),
    sub: yup.string().strict().required(),
    exp: yup.number().required(),
    iat: yup.number().required(),
    jti: yup.string().strict().required(),
    nonce: yup.string().strict().required(),
    email: yup.string().strict(),
    name: yup.string().strict(),
    given_name: yup.string().strict(),
    family_name: yup.string().strict(),
    "https://id.worldcoin.org/beta": yup
      .object({
        likely_human: yup.string().strict().required(),
        credential_type: yup.string().strict().required(),
      })
      .required(),
  });

  let payload: yup.InferType<typeof payloadSchema> | null = null;

  try {
    payload = payloadSchema.validateSync({
      iss: JWT_ISSUER,
      sub: nullifier_hash,
      jti: randomUUID(),
      iat: formatOIDCDateTime(new Date()),
      exp: formatOIDCDateTime(dayjs().add(1, "hour")),
      aud: app_id,
      nonce,
      ...(scope.includes(OIDCScopes.Email)
        ? { email: email ?? `${nullifier_hash}@id.worldcoin.org` }
        : {}),

      name,
      given_name,
      family_name,
      "https://id.worldcoin.org/beta": {
        likely_human:
          credential_type === CredentialType.Orb ? "strong" : "weak",
        credential_type,
      },
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(`Invalid payload: ${error.message}`);
    }

    throw error;
  }

  const header = {
    typ: "application/id_token+jwt",
    alg: "RS256",
    kid,
  };

  if (scope.includes(OIDCScopes.Email)) {
    payload.email = `${nullifier_hash}@id.worldcoin.org`;
  }

  if (scope.includes(OIDCScopes.Profile)) {
    payload.name = "World ID User";
    payload.given_name = "World ID";
    payload.family_name = "User";
  }

  const client = await getKMSClient();

  if (client) {
    const token = await signJWTWithKMSKey(client, header, payload);
    if (token) return token;
  }

  throw new Error("Failed to sign JWT from KMS.");
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
    await jose.importJWK(public_jwk, "RS256"),
    {
      issuer: JWT_ISSUER,
    }
  );

  return payload;
};
