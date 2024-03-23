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
import {Section} from "@/components/Section";

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

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
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
          <Section>
            <Section.Header>
              <Section.Header.Title>API keys</Section.Header.Title>

              <Section.Header.Button>
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
              </Section.Header.Button>
            </Section.Header>

            <div className="order-2 md:pb-8">
              {loading ? (
                <Skeleton count={5} />
              ) : (
                <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
              )}
            </div>
          </Section>
        )}
      </SizingWrapper>
    </>
  );
};
