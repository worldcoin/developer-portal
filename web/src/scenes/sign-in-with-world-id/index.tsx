import { memo } from "react";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import useApps from "src/hooks/useApps";
import useSignInAction from "src/hooks/useSignInAction";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Status } from "./Status";

export const SignIn = memo(function SignIn(props: { user_id?: string }) {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actionIsLoading } = useSignInAction();

  return (
    <Layout userId={props.user_id} title="Sign in">
      {(appIsLoading || actionIsLoading) && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!appIsLoading && !currentApp && (
        <div className="w-full h-full flex justify-center items-center">
          <h1 className="text-20 font-sora font-semibold">App not found</h1>
        </div>
      )}

      {!appIsLoading && !actionIsLoading && currentApp && (
        <div className="grid gap-y-12 content-start">
          <Header />
          <Status />
          <Credentials />
          <Redirects />
          {/* NOTE: https://linear.app/worldcoin/issue/WID-370#comment-d47da43e  */}
          {/* <DefaultAuthorizationLink /> */}
        </div>
      )}
    </Layout>
  );
});
