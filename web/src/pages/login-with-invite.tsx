import { GetServerSidePropsContext } from "next";
import {
  generateLoginNonce,
  generateLoginUrl,
} from "src/backend/login-internal";
import { Login } from "src/scenes/login-with-invite";
export default Login;

export interface ILoginPageProps {
  loginUrl?: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  if (ctx.query?.id_token) {
    // If `id_token` is passed, it means that user has been redirected back from the IdP.
    return { props: {} };
  }
  const nonce = await generateLoginNonce();
  const loginUrl = generateLoginUrl(nonce, "/login-with-invite");

  return {
    props: {
      loginUrl: loginUrl,
    } as ILoginPageProps,
  };
}
