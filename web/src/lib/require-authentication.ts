import { decodeJwt } from "jose";
import { GetServerSideProps, Redirect } from "next";
import {
  getTokenFromCookie,
  isAuthCookieValid,
  setCookie,
} from "src/backend/cookies";
import { urls } from "./urls";

type GGSRContext = Parameters<GetServerSideProps>[0];

export const requireAuthentication = (
  gssp?: (
    context: GGSRContext,
    user_id?: string
  ) => ReturnType<GetServerSideProps>
) => {
  return async (context: GGSRContext) => {
    const isAuthenticated = await isAuthCookieValid(context);

    if (!isAuthenticated) {
      setCookie(
        "auth",
        { returnTo: context.resolvedUrl },
        context.req,
        context.res
      );

      return {
        redirect: {
          destination: urls.login(),
          statusCode: 302,
        } as Redirect,
      };
    }

    const token = getTokenFromCookie(context.req, context.res);
    let user_id;

    if (token) {
      user_id = decodeJwt(token).sub;
    }

    if (!gssp) {
      return {
        props: {
          user_id,
        },
      };
    }

    return await gssp(context, user_id);
  };
};
