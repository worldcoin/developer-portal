import { SizingWrapper } from "@/components/SizingWrapper";
import { EngineType } from "@/lib/types";
import { fetchAppEnvCached } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

type SignInWithWorldIdLayoutProps = {
  children: ReactNode;
  params: Promise<Record<string, string>>;
};

export const SignInWithWorldIdLayout = async (
  props: SignInWithWorldIdLayoutProps,
) => {
  const params = await props.params;
  const appId = params?.appId;

  if (appId) {
    const { app } = await fetchAppEnvCached(appId);

    if (app?.[0]?.engine === EngineType.OnChain) {
      notFound();
    }
  }

  return (
    <div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
