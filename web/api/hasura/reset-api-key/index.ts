import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as checkUserPermissions } from "./graphql/check-user-permission.generated";
import { getSdk as updateAPIKey } from "./graphql/update-api-key.generated";

export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();

  if (body?.action.name !== "reset_api_key") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (body.session_variables["x-hasura-role"] === "admin") {
    logger.error("Admin not allowed to run _reset-client-client-secret"),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({
      req,
      detail: "Admin is not allowed to run this query.",
      code: "admin_not_allowed",
    });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const team_id = body.input.team_id;
  if (!team_id) {
    return errorHasuraQuery({
      req,
      detail: "team_id must be set.",
      code: "required",
    });
  }

  const id = body.input.id;
  if (!id) {
    return errorHasuraQuery({
      req,
      detail: "id must be set.",
      code: "required",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  const { team: userTeam } = await checkUserPermissions(
    client,
  ).CheckUserPermission({
    id: id,
    team_id,
    user_id: userId,
  });

  if (!userTeam || !userTeam.length) {
    return errorHasuraQuery({
      req,
      detail: "User does not have sufficient permissions.",
      code: "no_permission",
      team_id,
    });
  }

  // Generate a new API key for the given key id
  const { secret, hashed_secret } = generateHashedSecret(id);
  const api_key = `api_${Buffer.from(`${id}:${secret}`)
    .toString("base64")
    .replace(/=/g, "")}`;

  const { update_api_key } = await updateAPIKey(client).UpdateAPIKey({
    id,
    hashed_secret,
  });

  if (!update_api_key || !update_api_key.affected_rows) {
    return errorHasuraQuery({
      req,
      detail: "Failed to rotate the API key.",
      code: "rotate_failed",
      team_id,
    });
  }

  return NextResponse.json({ api_key });
};
