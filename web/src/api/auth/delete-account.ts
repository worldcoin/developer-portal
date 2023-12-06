import { logger } from "@/lib/logger";
import { Session, getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "src/backend/errors";
import { urls } from "src/lib/urls";

export const deleteAccount = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (
      !process.env.AUTH0_CLIENT_ID ||
      !process.env.AUTH0_CLIENT_SECRET ||
      !process.env.AUTH0_DOMAIN
    ) {
      return errorResponse(
        res,
        500,
        "internal_server_error",
        "Something went wrong",
        null,
        req
      );
    }

    const session = (await getSession(req, res)) as Session;
    const id = session.user.sub;

    const managementClient = new ManagementClient({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      domain: process.env.AUTH0_DOMAIN,
    });

    try {
      await managementClient.users.delete({ id });
    } catch (error) {
      return errorResponse(
        res,
        500,
        "internal_server_error",
        "Failed to delete account",
        null,
        req
      );
    }

    return res.redirect(307, urls.logout());
  }
);
