import { GetServerSidePropsContext } from "next";
import { Login } from "src/scenes/login/login";
export default Login;

export interface ILoginPageProps {
  error?: string | null;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const error = ctx.query.error ?? null;

  return {
    props: {
      error,
    } as ILoginPageProps,
  };
}
