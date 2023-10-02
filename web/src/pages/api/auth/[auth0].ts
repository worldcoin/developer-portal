import { handleAuth, handleLogin, handleLogout } from "@auth0/nextjs-auth0";
import { NextApiRequest } from "next";
import { Auth0Error } from "src/lib/types";

export default handleAuth({
  login: handleLogin((req) => {
    const id = (req as NextApiRequest).query.id;

    return {
      returnTo: id ? `/api/auth0?id=${id}` : "/api/auth0",
    };
  }),

  logout: handleLogout((req) => {
    const error = (req as NextApiRequest).query.error as Auth0Error;

    return {
      returnTo: error ? `/logout?error=${error}` : "/logout",
    };
  }),

  onError: (_req, res, error) => {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  },
});
