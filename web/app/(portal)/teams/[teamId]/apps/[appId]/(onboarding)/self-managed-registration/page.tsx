import type { Metadata } from "next";
import { generateMetaTitle } from "@/lib/genarate-title";
import { isSelfManagedEnabled } from "@/lib/feature-flags";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SelfManagedRegistrationPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedRegistration/page";
import { getSdk } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/server/fetch-rp-registration.generated";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Self-Managed Registration" }),
};

export default async function SelfManagedRegistrationRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ teamId, appId }, { next }] = await Promise.all([
    params,
    searchParams,
  ]);
  const client = await getAPIServiceGraphqlClient();
  const { rp_registration } = await getSdk(client).FetchRpRegistration({
    appId,
  });

  if (rp_registration[0]) {
    redirect(urls.worldId40({ team_id: teamId, app_id: appId }));
  }

  if (!isSelfManagedEnabled()) {
    redirect(
      urls.configureSignerKey({
        team_id: teamId,
        app_id: appId,
        next: next === "actions" ? "actions" : "configuration",
      }),
    );
  }

  return <SelfManagedRegistrationPage />;
}
