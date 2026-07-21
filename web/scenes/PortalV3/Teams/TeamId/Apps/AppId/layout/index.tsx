import { ErrorPage } from "@/components/ErrorPage";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { ReactNode } from "react";

type AppIdLayoutProps = {
  params: { teamId?: string; appId?: string };
  children: ReactNode;
};

export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const appId = props.params.appId;

  if (!appId || !(await getIsUserAllowedToReadApp(appId))) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  return <>{props.children}</>;
};
