import { memo, useEffect } from "react";
import { AuthRequired } from "src/components/AuthRequired";
import { Layout } from "src/components/Layout";
import { getActionStore, useActionStore } from "src/stores/actionStore";
import { IAppStore, useAppStore } from "src/stores/appStore";
import { Credentials } from "./Credentials";
import { DefaultAuthorizationLink } from "./DefaultAuthorizationLink";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const SignIn = memo(function SignIn() {
  const { currentApp } = useAppStore(getStoreParams);
  const { fetchSignInAction } = useActionStore(getActionStore);

  useEffect(() => {
    fetchSignInAction(currentApp?.id ?? "");
  }, [currentApp?.id, fetchSignInAction]);

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
