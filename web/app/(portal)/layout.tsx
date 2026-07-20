import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout as PortalLayoutV2 } from "@/scenes/Portal/layout";
import { PortalLayout as PortalLayoutV3 } from "@/scenes/PortalV3/layout";
import { headers } from "next/headers";
import { ReactNode } from "react";

export default async function PortalRootLayout(props: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const portal = await pickPortalVersion(
    () => <PortalLayoutV3>{props.children}</PortalLayoutV3>,
    () => <PortalLayoutV2>{props.children}</PortalLayoutV2>,
  );

  return <ApolloWrapper nonce={nonce}>{portal}</ApolloWrapper>;
}
