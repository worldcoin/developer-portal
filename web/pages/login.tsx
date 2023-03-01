import { generateLoginNonce, getDevToken } from "api-helpers/login-internal";
import { OIDC_BASE_URL } from "consts";
import { GetServerSidePropsContext } from "next";
import { Login } from "scenes/login/login";
export default Login;

export interface ILoginPageProps {
  loginUrl?: string;
  devToken?: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  if (ctx.query?.id_token) {
    // If `id_token` is passed, it means that user has been redirected back from the IdP.
    return { props: {} };
  }
  const nonce = await generateLoginNonce();

  const loginUrl = new URL(`${OIDC_BASE_URL}/authorize`);
  loginUrl.searchParams.append("nonce", nonce);
  loginUrl.searchParams.append("response_type", "id_token");
  loginUrl.searchParams.append(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_APP_URL}/login`
  );
  loginUrl.searchParams.append(
    "client_id",
    process.env.SIGN_IN_WITH_WORLD_ID_APP_ID ?? "app_developer_portal"
  );

  const devToken =
    process.env.NODE_ENV !== "production" &&
    !ctx.req.url?.includes("https://developer.worldcoin.org")
      ? await getDevToken()
      : undefined;

  return {
    props: {
      loginUrl: loginUrl.toString(),
      devToken,
    } as ILoginPageProps,
  };
}
