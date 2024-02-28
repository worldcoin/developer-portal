import { errorResponse } from "@/api/helpers/errors";
import { logger } from "@/lib/logger";
import { urls } from "@/lib/urls";
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";
import { NextRequest } from "next/server";

export const deleteAccount = withApiAuthRequired(async (req: NextRequest) => {
  if (
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET ||
    !process.env.AUTH0_DOMAIN
  ) {
    logger.error("Missing Auth0 environment variables.");

    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Something went wrong",
      req,
    });
  }

  const session = await getSession();
  const id = session?.user.sub;

  const managementClient = new ManagementClient({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  try {
    await managementClient.users.delete({ id });
  } catch (error) {
    logger.error("Error deleting account.", { error });

    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Failed to delete account",
      req,
    });
  }

  return Response.redirect(
    new URL(urls.logout(), process.env.NEXT_PUBLIC_APP_URL),
    307,
  );
});
