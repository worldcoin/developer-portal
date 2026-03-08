import { AppIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout({ params, children }: Props) {
  const resolvedParams = await Promise.resolve(params);
  return <AppIdLayout params={resolvedParams}>{children}</AppIdLayout>;
}
