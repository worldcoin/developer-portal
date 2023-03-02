import { AuthRequired } from "src/common/AuthRequired";
import { Layout } from "src/common/Layout";
import { memo, useEffect } from "react";
import { useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { useSignInActionStore } from "./store";
import { Header } from "./Header";
import { Status } from "./Status";
import { Credentials } from "./Credentials";
import { Redirects } from "./Redirects";
import { DefaultAuthorizationLink } from "./DefaultAuthorizationLink";

export const SignIn = memo(function SignIn() {
  const currentApp = useAppStore((state) => state.currentApp);
  const { signInAction, fetchSignInAction } = useSignInActionStore(
    (state) => ({ ...state }),
    shallow
  );

  useEffect(() => {
    fetchSignInAction(currentApp?.id ?? "");
  }, [currentApp?.id, fetchSignInAction, signInAction]);

  return (
    <AuthRequired>
      <Layout title="Sign in" mainClassName="grid gap-y-12 content-start">
        <Header />
        <Status />
        <Credentials />
        <Redirects />
        <DefaultAuthorizationLink />
      </Layout>
    </AuthRequired>
  );
});
