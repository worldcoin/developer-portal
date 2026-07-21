"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { ActiveKioskPage } from "../Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk/ActiveKiosk";
import { GetKioskActionDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk/graphql/client/get-kiosk-action.generated";
import { useQuery } from "@apollo/client/react";

type ActionIdKioskPageProps = {
  params: Promise<Record<string, string>>;
};
export const ActionIdKioskPage = (props: ActionIdKioskPageProps) => {
  const params = use(props.params);
  const searchParams = useSearchParams();

  const verificationLevel = searchParams?.get(
    "verification-level",
  ) as LegacyVerificationLevel;

  const appId = params?.appId as `app_${string}`;
  const actionId = params?.actionId as `action_${string}`;

  const { data } = useQuery(GetKioskActionDocument, {
    variables: {
      action_id: actionId,
      app_id: appId,
    },
  });

  return (
    <SizingWrapper gridClassName="order-2 pt-6 md:pt-10">
      {data && (
        <ActiveKioskPage
          params={params}
          data={data}
          verificationLevel={verificationLevel}
        />
      )}
    </SizingWrapper>
  );
};
