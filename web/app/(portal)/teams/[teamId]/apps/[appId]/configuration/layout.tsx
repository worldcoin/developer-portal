import { AppProfileLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/layout";
import { ReactNode } from "react";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return <AppProfileLayout params={params}>{children}</AppProfileLayout>;
}
