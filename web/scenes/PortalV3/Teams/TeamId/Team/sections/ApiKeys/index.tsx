"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Section } from "@/components/Section";
import { SkeletonTable } from "@/components/Skeletons";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ApiKeysTable } from "./ApiKeyTable";
import { CreateKeyModal } from "./CreateKeyModal";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { useQuery } from "@apollo/client/react";

export const ApiKeys = (props: { teamId?: string; canWrite: boolean }) => {
  const { teamId, canWrite } = props;
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const { data, loading } = useQuery(FetchKeysDocument, {
    variables: { teamId: teamId ?? "" },
  });

  const apiKeys = data?.api_key;
  return (
    <Section>
      <Section.Header>
        <Section.Header.Title>API keys</Section.Header.Title>

        {canWrite ? (
          <Section.Header.Button>
            {loading ? (
              <Skeleton width={150} />
            ) : apiKeys?.length ? (
              <DecoratedButton
                type="button"
                variant="primary"
                onClick={() => setShowCreateKeyModal(true)}
                className="py-3"
              >
                <PlusIcon className="size-5" /> New key
              </DecoratedButton>
            ) : null}
          </Section.Header.Button>
        ) : null}
      </Section.Header>

      {canWrite ? (
        <CreateKeyModal
          teamId={teamId ?? ""}
          isOpen={showCreateKeyModal}
          setIsOpen={setShowCreateKeyModal}
        />
      ) : null}

      {!loading && apiKeys?.length === 0 ? (
        <div className="grid grid-cols-1 justify-items-center gap-y-8 pt-12">
          <div className="grid justify-items-center gap-y-5">
            <Typography variant={TYPOGRAPHY.H6}>No API keys found</Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              Create a secure API key to seamlessly <br />
              manage your team&apos;s apps.
              <br />
              <br />
              Also used for MCP authorization
            </Typography>
          </div>

          {canWrite ? (
            <DecoratedButton
              type="button"
              onClick={() => setShowCreateKeyModal(true)}
            >
              Create new key
            </DecoratedButton>
          ) : null}
        </div>
      ) : (
        <div className="order-2 md:pb-8">
          {loading ? (
            <>
              <SkeletonTable
                columns={["Name", "API Key", "Created", "Status"]}
                rows={4}
                className="max-md:hidden"
              />
              {/* Rows collapse to stacked cards below md, so does their skeleton. */}
              <div className="grid gap-y-2 md:hidden">
                <Skeleton count={4} height={56} className="rounded-xl" />
              </div>
            </>
          ) : (
            <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
          )}
        </div>
      )}
    </Section>
  );
};
