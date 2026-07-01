import { AppIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = { params: AppLayoutRouteParams; children: ReactNode };

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return <AppIdLayout params={params}>{children}</AppIdLayout>;
}
