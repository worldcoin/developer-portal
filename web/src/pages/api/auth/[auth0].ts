import {
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
} from "@auth0/nextjs-auth0";

import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next";
import { urls } from "src/lib/urls";
import { verifyUserJWT } from "src/backend/jwts";

export default handleAuth({
  login: handleLogin({
    returnTo: "/api/auth0",
  }),

  logout: handleLogout((req) => {
    const error = (req as NextApiRequest).query.error;

    return {
      returnTo: error ? `/logout?error=${error}` : "/logout",
    };
  }),

  callback: handleCallback,

  "change-email-callback": async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    const auth = getCookie("auth", { req, res }) as string;

    try {
      const token = JSON.parse(auth).token;
      const isTokenValid = await verifyUserJWT(token);

      if (!isTokenValid) {
        throw new Error("Invalid token");
      }
    } catch (error) {
      console.error("Auth0 callback error:", error);
      res.redirect(urls.logout({ error: true }));
    }

    res.redirect(307, urls.app());
  },

  onError: (_req, res, error) => {
    console.error("Auth0 error:", error);
    res.status(error.status || 500).end(error.message);
  },
});
