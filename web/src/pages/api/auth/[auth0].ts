import { handleAuth, handleLogin, handleLogout } from "@auth0/nextjs-auth0";
import { NextApiRequest } from "next";

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

  onError: (_req, res, error) => {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  },
});
