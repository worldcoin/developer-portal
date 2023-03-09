import { memo, useEffect } from "react";
import { AuthRequired } from "src/components/AuthRequired";
import { Layout } from "src/components/Layout";
import { IAppStore, useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";
import { useSignInActionStore } from "./store";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const SignIn = memo(function SignIn() {
  const { currentApp } = useAppStore(getStoreParams);

  const { fetchSignInAction } = useSignInActionStore(
    (state) => ({ ...state }),
    shallow
  );

  useEffect(() => {
    if (currentApp) {
      fetchSignInAction(currentApp.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we need to this runs only on update currentApp
  }, [currentApp]);

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
