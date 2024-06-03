"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { useSearchParams } from "next/navigation";
import { ActiveKioskPage } from "../Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk/ActiveKiosk";
import { useGetKioskActionQuery } from "../Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk/graphql/client/get-kiosk-action.generated";

type ActionIdKioskPageProps = {
  params: Record<string, string> | null | undefined;
};
export const ActionIdKioskPage = (props: ActionIdKioskPageProps) => {
  const { params } = props;
  const searchParams = useSearchParams();

  const verificationLevel = searchParams?.get(
    "verification-level",
  ) as VerificationLevel;

  const appId = params?.appId as `app_${string}`;
  const actionId = params?.actionId as `action_${string}`;

  const { data } = useGetKioskActionQuery({
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
          toggleKiosk={() => true}
          verificationLevel={verificationLevel}
        />
      )}
    </SizingWrapper>
  );
};
