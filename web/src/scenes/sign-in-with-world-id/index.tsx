import { memo } from "react";
import { AuthRequired } from "src/components/AuthRequired";
import { Layout } from "src/components/Layout";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";

export const SignIn = memo(function SignIn() {
  return (
    <AuthRequired>
      <Layout title="Sign in" mainClassName="grid gap-y-12 content-start">
        <Header />
        <Status />
        <Credentials />
        <Redirects />
        {/* NOTE: https://linear.app/worldcoin/issue/WID-370#comment-d47da43e  */}
        {/* <DefaultAuthorizationLink /> */}
      </Layout>
    </AuthRequired>
  );
});
