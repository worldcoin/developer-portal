import { memo } from "react";
import { Layout } from "src/components/Layout";
import useRedirectOnAppNotFound from "src/hooks/useRedirectOnAppNotFound";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";

export const SignIn = memo(function SignIn(props: { user_id?: string }) {
  useRedirectOnAppNotFound();

  return (
    <Layout
      userId={props.user_id}
      title="Sign in"
      mainClassName="grid gap-y-12 content-start"
    >
      <Header />
      <Status />
      <Credentials />
      <Redirects />
      {/* NOTE: https://linear.app/worldcoin/issue/WID-370#comment-d47da43e  */}
      {/* <DefaultAuthorizationLink /> */}
    </Layout>
  );
});
