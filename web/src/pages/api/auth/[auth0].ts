// pages/api/auth/[auth0].js
import { handleAuth, handleLogin, handleLogout } from "@auth0/nextjs-auth0";
import { deleteCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next";

export default handleAuth({
  login: handleLogin({
    returnTo: "/api/auth0",
  }),

  logout: handleLogout({
    returnTo: "/logout",
  }),

  onError: (req, res, error) => {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  },
});
