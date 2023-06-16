/**
 * Helpers in this file are used for authentication to the Dev Portal.
 * Nothing to do with Sign in with World ID in general or OIDC.
 */

import { gql } from "@apollo/client";
import crypto from "crypto";
import dayjs from "dayjs";
import { OIDC_BASE_URL } from "src/lib/constants";
import { getAPIServiceClient } from "./graphql";
import { getUserJWTPayload, _generateJWT } from "./jwts";

export const JWT_ISSUER = process.env.JWT_ISSUER;

if (!JWT_ISSUER) {
  throw new Error("Improperly configured. `JWT_ISSUER` env var must be set!");
}

const GenerateLoginNonceQuery = gql`
  mutation GenerateLoginNonce($key: String!) {
    insert_cache_one(object: { key: $key, value: "1" }) {
      key
    }
  }
`;

const GetAndExpireLoginNonceQuery = gql`
  mutation GetAndExpireLoginNonce($key: String!, $max_time: timestamptz!) {
    delete_cache(
      where: { key: { _eq: $key }, created_at: { _gt: $max_time } }
    ) {
      affected_rows
    }
  }
`;

const GetFirstUserQuery = gql`
  query GetFirstUser {
    user(limit: 1) {
      id
      team_id
    }
  }
`;

export const generateLoginNonce = async (): Promise<string> => {
  const nonce = crypto.randomBytes(16).toString("hex");
  const client = await getAPIServiceClient();

  await client.mutate({
    mutation: GenerateLoginNonceQuery,
    variables: {
      key: `login_nonce_${nonce}`,
    },
  });

  return nonce;
};

export const verifyLoginNonce = async (nonce: string): Promise<boolean> => {
  const client = await getAPIServiceClient();
  const { data } = await client.mutate({
    mutation: GetAndExpireLoginNonceQuery,
    variables: {
      key: `login_nonce_${nonce}`,
      max_time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes
    },
  });

  return data?.delete_cache?.affected_rows === 1;
};

export const getDevToken = async (signing_key: string) => {
  const client = await getAPIServiceClient();
  const { data } = await client.query({
    query: GetFirstUserQuery,
  });

  const user = data?.user?.[0];

  if (!user) {
    return undefined;
  }

  // NOTE: payload logic is implemented here to use the provided key for added security, i.e. dev tokens will not be generated if the key is not provided.
  const payload = getUserJWTPayload(user.id, user.team_id);
  const expiration = dayjs().add(1, "day").unix();
  const token = await _generateJWT(payload, expiration, signing_key);
  return { token, expiration };
};

export const generateLoginUrl = (
  nonce: string,
  redirectTo: string = "/login"
) => {
  const loginUrl = new URL(`${OIDC_BASE_URL}/authorize`);
  loginUrl.searchParams.append("nonce", nonce);
  loginUrl.searchParams.append("response_type", "id_token");
  loginUrl.searchParams.append(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}`
  );
  loginUrl.searchParams.append(
    "client_id",
    process.env.SIGN_IN_WITH_WORLD_ID_APP_ID ?? "app_developer_portal"
  );

  return loginUrl.toString();
};
