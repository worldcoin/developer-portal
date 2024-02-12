"use client";
import { TeamProfile } from "../../common/TeamProfile";
import { useFetchKeysQuery } from "./graphql/client/fetch-keys.generated";
import { ApiKeysTable } from "./ApiKeyTable";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CreateKeyModal } from "./CreateKeyModal";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

type TeamApiKeysPageProps = {
  params: Record<string, string> | null | undefined;
};
export const TeamApiKeysPage = (props: TeamApiKeysPageProps) => {
  const { params } = props;
  const teamId = params?.teamId;
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);

  const { data, loading } = useFetchKeysQuery({
    context: { headers: { team_id: teamId } },
  });

  const apiKeys = data?.api_key;
  return (
    <div className="grid gap-y-8 grid-cols-1">
      <TeamProfile className="w-full" />
      <div className="w-full grid justify-items-center items-center gap-y-5">
        <CreateKeyModal
          teamId={teamId ?? ""}
          isOpen={showCreateKeyModal}
          setIsOpen={setShowCreateKeyModal}
        />
        {!loading && apiKeys?.length === 0 ? (
          <div className="grid grid-cols-1 gap-y-5 justify-items-center">
            <Typography variant={TYPOGRAPHY.H6}>No API keys found</Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-grey-500 text-center"
            >
              Create a secure API key to seamlessly <br />
              manage your team&apos;s World ID apps
            </Typography>
            <DecoratedButton
              type="button"
              onClick={() => setShowCreateKeyModal(true)}
            >
              Create new key
            </DecoratedButton>
          </div>
        ) : (
          <div className="w-full grid gap-y-7">
            <div className="flex justify-between items-center gap-x-2">
              <Typography variant={TYPOGRAPHY.H7}>API keys</Typography>
              {loading ? (
                <Skeleton width={150} />
              ) : (
                <DecoratedButton
                  type="button"
                  onClick={() => setShowCreateKeyModal(true)}
                >
                  Create new key
                </DecoratedButton>
              )}
            </div>
            {loading ? (
              <Skeleton count={5} />
            ) : (
              <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
