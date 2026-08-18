import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { CreateTeamDialog } from "@/scenes/Onboarding/CreateTeam/Dialog";
import { PortalLayout } from "@/scenes/PortalV3/layout";
import { CreateAppDialog } from "@/scenes/common/layout/CreateAppDialog";
import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";

export default async function PortalRootLayout(props: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <ApolloWrapper nonce={nonce}>
      <PortalLayout>{props.children}</PortalLayout>
      <Suspense fallback={null}>
        <CreateAppDialog />
        <CreateTeamDialog />
      </Suspense>
    </ApolloWrapper>
  );
}
