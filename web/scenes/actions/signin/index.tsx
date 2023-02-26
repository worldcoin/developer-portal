import { AuthRequired } from "common/AuthRequired";
import { Layout } from "common/Layout";
import { memo } from "react";

export const SignIn = memo(function SignIn() {
  return (
    <AuthRequired>
      <Layout title="Sign in Action">
        <div>signin page</div>
      </Layout>
    </AuthRequired>
  );
});
