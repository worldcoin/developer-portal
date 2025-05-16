import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { corsHandler } from "@/api/helpers/utils";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getJWKsSdk } from "./graphql/get-jwks.generated";

/**
 * Retrieves JWKs to verify proofs
 * @param req
 * @param res
 */
export async function GET(req: NextRequest) {
  const client = await getAPIServiceGraphqlClient();
  const getJWKs = getJWKsSdk(client);
  const response = await getJWKs.JWKQuery();

  const keys = [];
  for (const { id, key } of response.jwks) {
    keys.push({ ...key, kid: id });
  }

  return corsHandler(NextResponse.json({ keys }), ["GET", "OPTIONS"]);
}

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), [
    "GET",
    "OPTIONS",
  ]);
}
