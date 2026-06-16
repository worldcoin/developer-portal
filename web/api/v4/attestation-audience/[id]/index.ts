import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isValidRpId, RpRegistrationStatus } from "@/api/helpers/rp-utils";
import { appIdRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getAttestationAudienceSdk } from "./graphql/get-attestation-audience.generated";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=5, stale-if-error=300",
};

type AttestationAudienceResponse = {
  app_id: string;
  rp_id: string | null;
  production_registration_status: RpRegistrationStatus | null;
  staging_registration_status: RpRegistrationStatus | null;
  verified: boolean;
};

function isValidAttestationAudienceId(id: string) {
  return isValidRpId(id) || appIdRegex.test(id);
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const id = params.id;

  if (!isValidAttestationAudienceId(id)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_id",
      detail: "Invalid id format. Expected app_id or rp_id.",
      attribute: "id",
      req,
    });
  }

  const client = await getAPIServiceGraphqlClient();
  const sdk = getAttestationAudienceSdk(client);

  if (!isValidRpId(id)) {
    const { app_by_pk: app } = await sdk.GetAttestationAudienceByAppId({
      app_id: id,
    });

    if (!app) {
      return errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "App not found.",
        attribute: "id",
        req,
      });
    }

    const registration = app.rp_registration[0] ?? null;

    const responseBody: AttestationAudienceResponse = {
      app_id: app.id,
      rp_id: registration?.rp_id ?? null,
      production_registration_status:
        (registration?.status as RpRegistrationStatus | undefined) ?? null,
      staging_registration_status:
        (registration?.staging_status as RpRegistrationStatus | null) ?? null,
      verified: app.verified_app_metadata.length > 0,
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: PUBLIC_CACHE_HEADERS,
    });
  }

  const response = await sdk.GetAttestationAudienceByRpId({ rp_id: id });

  const registration = response.rp_registration[0];

  if (!registration) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "RP registration not found.",
      attribute: "id",
      req,
    });
  }

  const responseBody: AttestationAudienceResponse = {
    app_id: registration.app_id,
    rp_id: registration.rp_id,
    production_registration_status: registration.status as RpRegistrationStatus,
    staging_registration_status:
      (registration.staging_status as RpRegistrationStatus | null) ?? null,
    verified: registration.app.verified_app_metadata.length > 0,
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: PUBLIC_CACHE_HEADERS,
  });
}
