import { AuthRequired } from "common/AuthRequired";
import { Layout } from "common/Layout";
import { memo, useEffect } from "react";
import { getAppStore, useAppStore } from "stores/app-store";
import { shallow } from "zustand/shallow";
import { Credentials } from "./Credentials";
import { DefaultAuthorizationLink } from "./DefaultAuthorizationLink";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";
import { useSignInActionStore } from "./store";

export const SignIn = memo(function SignIn() {
  const { currentApp } = useAppStore(getAppStore);
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
