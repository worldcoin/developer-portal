"use client";
import { useQuery } from "@apollo/client/react";
import { GetIsAppBannedDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/page/graphql/client/get-is-app-banned.generated";
import { BanStatus } from "./ban-status";

export const BanStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useQuery(GetIsAppBannedDocument, {
    variables: {
      app_id: appId,
    },
  });

  // NOTE: it's possible app array is empty
  const isAppBanned = !!data?.app[0]?.id;

  return isAppBanned && <BanStatus />;
};
