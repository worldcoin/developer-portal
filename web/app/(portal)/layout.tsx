import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { CreateTeamDialog } from "@/scenes/Onboarding/CreateTeam/Dialog";
import { PortalLayout as PortalLayoutV3 } from "@/scenes/PortalV3/layout";
import { CreateAppDialog } from "@/scenes/common/layout/CreateAppDialog";
import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";

export default async function PortalRootLayout(props: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const portal = <PortalLayoutV3>{props.children}</PortalLayoutV3>;

  return (
    <ApolloWrapper nonce={nonce}>
      {portal}
      <Suspense fallback={null}>
        <CreateAppDialog />
        <CreateTeamDialog />
      </Suspense>
    </ApolloWrapper>
  );
}
