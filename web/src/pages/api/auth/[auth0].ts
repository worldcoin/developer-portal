import {
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
} from "@auth0/nextjs-auth0";

import { NextApiRequest, NextApiResponse } from "next";
import { auth0FetchUser } from "src/api/auth/fetch-user";
import { auth0Login } from "src/api/auth/login-callback";

export default handleAuth({
  login: handleLogin({
    returnTo: "/api/auth/login-callback",
  }),

  callback: handleCallback,
  "login-callback": auth0Login,
  "fetch-user": auth0FetchUser,

  logout: handleLogout((req) => {
    const error = (req as NextApiRequest).query.error;

    return {
      returnTo: error ? `/login?error=${error}` : "/login",
    };
  }),

  onError: (_req, res, error) => {
    console.error("Auth0 error:", error);
    res.status(error.status || 500).end(error.message);
  },
});
