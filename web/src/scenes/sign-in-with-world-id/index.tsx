import { memo } from "react";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import useApps from "src/hooks/useApps";
import useSignInAction from "src/hooks/useSignInAction";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { NotFound } from "@/components/NotFound";

export const SignIn = memo(function SignIn(props: { user_id?: string }) {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actionIsLoading } = useSignInAction();

  return (
    <Layout userId={props.user_id} title="Sign in" mainClassName="grid">
      {(appIsLoading || actionIsLoading) && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!appIsLoading && !currentApp && <NotFound className="self-center" />}

      {!appIsLoading && !actionIsLoading && currentApp && (
        <div className="grid gap-y-12 content-start">
          <Header />
          <Credentials />
          <Redirects />
          {/* NOTE: https://linear.app/worldcoin/issue/WID-370#comment-d47da43e  */}
          {/* <DefaultAuthorizationLink /> */}
        </div>
      )}
    </Layout>
  );
});
