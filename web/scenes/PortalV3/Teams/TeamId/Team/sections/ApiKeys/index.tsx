"use client";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { ApiKeysTable } from "./ApiKeyTable";
import { RotateKeyModal } from "./ApiKeyTable/RotateKeyModal";
import { CreateKeyModal } from "./CreateKeyModal";
import { ResetApiKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated";
import {
  FetchKeysDocument,
  FetchKeysQuery,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { SettingsPanel } from "@/scenes/PortalV3/Teams/TeamId/Team/common/SettingsPanel";

export const ApiKeys = (props: { teamId?: string; canWrite: boolean }) => {
  const { teamId, canWrite } = props;
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);

  // The rotate dialog lives up here — outside the skeleton/table swap — for the
  // same reason CreateKeyModal does: the mutation refetches FetchKeysDocument,
  // which re-renders this query as loading (Apollo v4 notifyOnNetworkStatusChange
  // defaults to true). Anything mounted below the swap gets unmounted mid-flow
  // and a one-time secret held there would be lost.
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [keyToRotate, setKeyToRotate] = useState<
    FetchKeysQuery["api_key"][0] | null
  >(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  const { data, loading } = useQuery(FetchKeysDocument, {
    variables: { teamId: teamId ?? "" },
  });

  const apiKeys = data?.api_key;
  // Skeletons only before the first result; a background refetch must not
  // unmount the populated table (and any dialog state living inside it).
  const isInitialLoad = loading && !apiKeys;

  const [resetApiKeyMutation, { loading: rotatingKey }] =
    useMutation(ResetApiKeyDocument);

  const rotateKey = useCallback(async () => {
    if (rotatingKey || !keyToRotate) {
      return;
    }

    try {
      const result = await resetApiKeyMutation({
        variables: {
          id: keyToRotate.id,
          team_id: teamId ?? "",
        },
        refetchQueries: [FetchKeysDocument],
      });

      if (result instanceof Error || Boolean(result?.error)) {
        throw result;
      }

      // The rotation already committed server-side and has no rollback, so a
      // missing secret is not the same failure as the mutation not running.
      if (!result.data?.reset_api_key?.api_key) {
        throw new Error("ROTATED_WITHOUT_SECRET");
      }

      toast.success("API key was reset");
      setRotatedSecret(result.data.reset_api_key.api_key);
    } catch (error) {
      let errorText =
        error instanceof Error && error.message === "ROTATED_WITHOUT_SECRET"
          ? "Key was rotated but the new secret could not be shown. Rotate again to get a new key."
          : "Error occurred while resetting API key.";

      if (CombinedGraphQLErrors.is(error)) {
        for (let graphQLError of error.errors) {
          if (
            graphQLError.message ===
            "User does not have sufficient permissions."
          ) {
            errorText = "API key must be active to reset.";
          }
        }
      }

      toast.error(errorText);
    }
  }, [keyToRotate, resetApiKeyMutation, rotatingKey, teamId]);

  const openRotateKeyModal = useCallback(
    (key: FetchKeysQuery["api_key"][0]) => {
      // Reset content here too: reopening during an interrupted leave
      // transition means clearRotateKeyModal (afterLeave) never fired.
      setRotatedSecret(null);
      setKeyToRotate(key);
      setIsRotateModalOpen(true);
    },
    [],
  );

  const closeRotateKeyModal = useCallback(() => {
    setIsRotateModalOpen(false);
  }, []);

  // Content state outlives the close: the dialog keeps rendering through its
  // leave transition, and clearing on close snaps the reveal back to the
  // confirm view mid-fade (visible flicker).
  const clearRotateKeyModal = useCallback(() => {
    setKeyToRotate(null);
    setRotatedSecret(null);
  }, []);

  return (
    <SettingsPanel>
      <SettingsPanel.Header>
        <SettingsPanel.Title>API keys</SettingsPanel.Title>
      </SettingsPanel.Header>

      {canWrite ? (
        <CreateKeyModal
          teamId={teamId ?? ""}
          isOpen={showCreateKeyModal}
          setIsOpen={setShowCreateKeyModal}
        />
      ) : null}

      {canWrite ? (
        <RotateKeyModal
          isOpen={isRotateModalOpen}
          name={keyToRotate?.name}
          loading={rotatingKey}
          rotatedKey={rotatedSecret}
          onConfirm={rotateKey}
          onClose={closeRotateKeyModal}
          afterLeave={clearRotateKeyModal}
        />
      ) : null}

      {isInitialLoad ? (
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
          {apiKeys?.length === 0 ? (
            <SettingsPanel.Body className="flex min-h-52 items-center justify-center border-y border-grey-100 px-5 py-8 text-center">
              <div>
                <p className="font-world text-13 leading-5 font-medium text-grey-900">
                  No API keys
                </p>
                <p className="mt-1 font-gta text-12 leading-4 text-grey-400">
                  You don&apos;t have any API keys associated with your
                  workspace
                </p>
              </div>
            </SettingsPanel.Body>
          ) : (
            <ApiKeysTable
              teamId={teamId}
              apiKeys={apiKeys}
              openRotateKeyModal={openRotateKeyModal}
            />
          )}
        </>
      )}

      <SettingsPanel.Footer>
        {isInitialLoad ? (
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
            disabled={isInitialLoad}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-8 bg-portal-ink px-3 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-500"
          >
            <PlusIcon className="size-4" />
            New key
          </button>
        ) : null}
      </SettingsPanel.Footer>
    </SettingsPanel>
  );
};
