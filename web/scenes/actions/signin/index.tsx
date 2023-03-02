import { Layout } from "common/Layout";
import { memo, useEffect } from "react";
import { getActionStore, useActionStore } from "stores/action-store";
import { getAppStore, useAppStore } from "stores/app-store";
import { Credentials } from "./Credentials";
import { DefaultAuthorizationLink } from "./DefaultAuthorizationLink";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";

export const SignIn = memo(function SignIn() {
  const { currentApp } = useAppStore(getAppStore);
  const { fetchSignInAction } = useActionStore(getActionStore);

  useEffect(() => {
    fetchSignInAction(currentApp?.id ?? "");
  }, [currentApp?.id, fetchSignInAction]);

  return (
    // <AuthRequired>
    <Layout title="Sign in" mainClassName="grid gap-y-12 content-start">
      <Header />
      <Status />
      <Credentials />
      <Redirects />
      <DefaultAuthorizationLink />
    </Layout>
    // </AuthRequired>
  );
});
