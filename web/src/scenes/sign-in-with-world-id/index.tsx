import { memo, useEffect, useMemo } from "react";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import useApps from "src/hooks/useApps";
import useSignInAction from "src/hooks/useSignInAction";
import { Credentials } from "./Credentials";
import { Header } from "./Header";
import { Redirects } from "./Redirects";
import { Urls } from "./Urls";
import { NotFound } from "@/components/NotFound";
import { useRouter } from "next/router";
import { urls } from "src/lib/urls";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Role_Enum } from "@/graphql/graphql";

export const SignIn = memo(function SignIn() {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actionIsLoading } = useSignInAction();
  const router = useRouter();
  const { user } = useUser() as Auth0SessionUser;
  const team_id = router.query.team_id as string;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === team_id
    );

    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [team_id, user?.hasura.memberships]);

  useEffect(() => {
    if (currentApp?.engine === "on-chain") {
      router.push(urls.app({ app_id: currentApp?.id, team_id }));
      return;
    }
  }, [currentApp?.engine, currentApp?.id, router, team_id]);

  return (
    <Layout title="Sign in" mainClassName="grid">
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
          {isEnoughPermissions && <Redirects />}
          {isEnoughPermissions && <Urls />}
          {/* NOTE: https://linear.app/worldcoin/issue/WID-370#comment-d47da43e  */}
          {/* <DefaultAuthorizationLink /> */}
        </div>
      )}
    </Layout>
  );
});
