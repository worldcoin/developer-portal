import { GetServerSidePropsContext } from "next";

import {
  generateLoginNonce,
  generateLoginUrl,
} from "src/backend/login-internal";

import { OIDC_BASE_URL } from "src/lib/constants";
import { Login } from "src/scenes/login/login";
export default Login;

export interface ILoginPageProps {
  loginUrl?: string;
  error?: string | null;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // if header referrer contains OIDC_BASE_URL, it means that user has been redirected back from the IdP.
  if (ctx.req.headers.referer?.includes(OIDC_BASE_URL)) {
    return { props: {} };
  }
  const nonce = await generateLoginNonce();
  const loginUrl = generateLoginUrl(nonce);
  const error = ctx.query.error ?? null;

  return {
    props: {
      loginUrl: loginUrl,
      error,
    } as ILoginPageProps,
  };
}
