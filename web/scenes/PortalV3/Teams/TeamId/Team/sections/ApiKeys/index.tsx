"use client";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ApiKeysTable } from "./ApiKeyTable";
import { CreateKeyModal } from "./CreateKeyModal";
import { McpSetup } from "./McpSetup";
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
    <>
      <section className="min-w-0 overflow-hidden rounded-12 border border-grey-200 bg-white">
        <div className="px-5 py-5">
          <h2 className="font-twk text-17 leading-6 font-[550] text-grey-900">
            API keys
          </h2>
        </div>

        {canWrite ? (
          <CreateKeyModal
            teamId={teamId ?? ""}
            isOpen={showCreateKeyModal}
            setIsOpen={setShowCreateKeyModal}
          />
        ) : null}

        {loading ? (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-y border-grey-100 bg-grey-25 px-5 py-2.5 font-gta text-12 leading-4 text-grey-400">
              <span>Name</span>
              <span>Status</span>
              <span aria-hidden="true" />
            </div>

            <div className="max-h-[229px] overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="grid min-h-16 grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-b border-grey-100 px-5 py-3 last:border-b-0"
                >
                  <div className="grid min-w-0 gap-1">
                    <Skeleton width="60%" />
                    <Skeleton width="85%" />
                  </div>
                  <Skeleton width={56} height={24} borderRadius={999} />
                  <Skeleton circle width={24} height={24} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
            {apiKeys?.length === 0 ? (
              <div className="flex h-36 items-center justify-center font-gta text-13 text-grey-400">
                No API keys found
              </div>
            ) : null}
          </>
        )}

        <div className="flex min-h-14 items-center justify-between gap-3 border-t border-grey-100 bg-grey-25 px-5 py-3">
          {loading ? (
            <Skeleton width={48} />
          ) : (
            <span className="font-gta text-12 text-grey-400">
              {apiKeys?.length ?? 0} {apiKeys?.length === 1 ? "key" : "keys"}
            </span>
          )}

          {canWrite ? (
            <button
              type="button"
              onClick={() => setShowCreateKeyModal(true)}
              disabled={loading}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-8 bg-portal-ink px-3 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-500"
            >
              <PlusIcon className="size-4" />
              New key
            </button>
          ) : null}
        </div>
      </section>
      <McpSetup />
    </>
  );
};
