import { logger } from "@/legacy/lib/logger";
import { LoginErrorCode } from "@/legacy/lib/types";
import {
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
} from "@auth0/nextjs-auth0";

import { NextApiRequest, NextApiResponse } from "next";
import { deleteAccount } from "@/legacy/api/auth/delete-account";
import { auth0Login } from "@/legacy/api/auth/login-callback";

export default handleAuth({
  login: (req: NextApiRequest, res: NextApiResponse) => {
    const invite_id = req.query.invite_id;

    return handleLogin(req, res, {
      returnTo: invite_id
        ? `/api/auth/login-callback?invite_id=${invite_id}`
        : "/api/auth/login-callback",
    });
  },

  callback: handleCallback,
  "login-callback": auth0Login,
  "delete-account": deleteAccount,

  logout: handleLogout((req) => {
    const login_error = (req as NextApiRequest).query.error as
      | LoginErrorCode
      | undefined;

    return {
      returnTo: login_error ? `/login?login_error=${login_error}` : "/login",
    };
  }),

  onError: (_req, res, error) => {
    logger.error("Auth0 error:", { error });
    res.status(error.status || 500).end("Error while authenticating");
  },
});
