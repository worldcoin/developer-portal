import { generateLoginNonce } from "api-helpers/login-internal";
import { OIDC_BASE_URL } from "consts";
import { Login } from "scenes/login/login";
export default Login;

export interface ILoginPageProps {
  loginUrl: string;
}

export async function getServerSideProps() {
  console.log(process.env.GENERAL_SECRET_KEY);
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

  return {
    props: {
      loginUrl: loginUrl.toString(),
    } as ILoginPageProps,
  };
}
