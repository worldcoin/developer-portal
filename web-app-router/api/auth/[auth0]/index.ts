import { loginCallback } from "@/api/login-callback";

import {
  AppRouteHandlerFnContext,
  HandlerError,
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
} from "@auth0/nextjs-auth0";

import { NextRequest, NextResponse } from "next/server";

export const auth0 = handleAuth({
  login: (req: NextRequest, ctx: AppRouteHandlerFnContext) => {
    const invite_id = req.nextUrl.searchParams.get("invite_id");

    return handleLogin(req, ctx, {
      returnTo: invite_id
        ? `/api/auth/login-callback?invite_id=${invite_id}`
        : "/api/auth/login-callback",
    });
  },

  callback: handleCallback,
  "login-callback": loginCallback,
  // TODO: Add delete account handler

  logout: handleLogout({
    returnTo: "/login",
  }),

  onError: (_req: NextRequest, error: HandlerError) => {
    NextResponse.json({
      status: error.status || 500,
      message: "Error while authenticating",
    });
  },
});
