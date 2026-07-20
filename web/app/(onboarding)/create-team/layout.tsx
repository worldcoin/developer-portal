import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { CreateTeamLayout } from "@/scenes/Onboarding/CreateTeam/layout";
import { headers } from "next/headers";
import { ReactNode } from "react";

export default async function CreateTeamRootLayout(props: {
  children: ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <ApolloWrapper nonce={nonce}>
      <CreateTeamLayout>{props.children}</CreateTeamLayout>
    </ApolloWrapper>
  );
}
