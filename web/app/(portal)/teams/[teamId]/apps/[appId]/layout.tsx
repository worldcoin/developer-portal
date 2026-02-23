import { AppIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";

type Props = {
  params:
    | {
        teamId: string;
        appId: string;
      }
    | Promise<{
        teamId: string;
        appId: string;
      }>;
  children: ReactNode;
};

export default async function Layout({ params, children }: Props) {
  const resolvedParams = await Promise.resolve(params);
  return <AppIdLayout params={resolvedParams}>{children}</AppIdLayout>;
}
