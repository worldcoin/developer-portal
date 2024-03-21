"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { TeamProfile } from "../../common/TeamProfile";
import { ApiKeysTable } from "./ApiKeyTable";
import { CreateKeyModal } from "./CreateKeyModal";
import { useFetchKeysQuery } from "./graphql/client/fetch-keys.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { PlusIcon } from "@/components/Icons/PlusIcon";

type TeamApiKeysPageProps = {
  params: Record<string, string> | null | undefined;
};

export const TeamApiKeysPage = (props: TeamApiKeysPageProps) => {
  const { params } = props;
  const teamId = params?.teamId;
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const { data, loading } = useFetchKeysQuery();

  const apiKeys = data?.api_key;
  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 pt-8">
        <div className="grid w-full items-center justify-items-center gap-y-5">
          <CreateKeyModal
            teamId={teamId ?? ""}
            isOpen={showCreateKeyModal}
            setIsOpen={setShowCreateKeyModal}
          />

          {!loading && apiKeys?.length === 0 ? (
            <div className="grid grid-cols-1 justify-items-center gap-y-8 pt-12">
              <div className="grid justify-items-center gap-y-5 ">
                <Typography variant={TYPOGRAPHY.H6}>
                  No API keys found
                </Typography>

                <Typography
                  variant={TYPOGRAPHY.R3}
                  className="text-center text-grey-500"
                >
                  Create a secure API key to seamlessly <br />
                  manage your team&apos;s World ID apps
                </Typography>
              </div>

              <DecoratedButton
                type="button"
                onClick={() => setShowCreateKeyModal(true)}
              >
                Create new key
              </DecoratedButton>
            </div>
          ) : (
            <div className="grid w-full gap-y-7">
              <div className="order-1 contents md:grid md:grid-cols-[1fr_auto] md:items-start">
                <Typography variant={TYPOGRAPHY.H7}>API keys</Typography>

                <div className="order-2 max-md:sticky max-md:bottom-0 max-md:order-4 max-md:grid max-md:justify-center max-md:py-8">
                  {loading ? (
                    <Skeleton width={150} />
                  ) : (
                    <DecoratedButton
                      type="button"
                      variant="primary"
                      onClick={() => setShowCreateKeyModal(true)}
                      className="py-3"
                    >
                      <PlusIcon className="size-5" /> New key
                    </DecoratedButton>
                  )}
                </div>
              </div>

              <div className="order-3 grow md:pb-8">
                {loading ? (
                  <Skeleton count={5} />
                ) : (
                  <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
                )}
              </div>
            </div>
          )}
        </div>
      </SizingWrapper>
    </>
  );
};
