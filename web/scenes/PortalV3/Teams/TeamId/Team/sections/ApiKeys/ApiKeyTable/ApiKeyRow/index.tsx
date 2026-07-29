"use client";
import { Dropdown } from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { formatDistanceToNowStrict } from "date-fns";
import { FetchKeysQuery } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";

import { EditIcon } from "@/components/Icons/EditIcon";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ApiKeySecretModal } from "../../ApiKeySecretModal";
import { RotateKeyModal } from "../RotateKeyModal";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { Status } from "./Status";
import { ResetApiKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated";

export const ApiKeyRow = (props: {
  apiKey: FetchKeysQuery["api_key"][0];
  index: number;
  teamId: string;
  openViewDetails: (key: FetchKeysQuery["api_key"][0]) => void;
  openDeleteKeyModal: (key: FetchKeysQuery["api_key"][0]) => void;
}) => {
  const { apiKey, index, teamId, openViewDetails, openDeleteKeyModal } = props;
  const [resetKey, setResetKey] = useState<string | null>(null);
  const [rotateOpen, setRotateOpen] = useState(false);
  const timeAgo = formatDistanceToNowStrict(new Date(apiKey.created_at), {
    addSuffix: true,
  });
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );
    return membership?.role === Role_Enum.Owner;
  }, [teamId, user?.hasura.memberships]);

  const [resetApiKeyMutation, { loading }] = useMutation(ResetApiKeyDocument);

  const resetAPIKey = useCallback(
    async (apiKeyId: string): Promise<boolean> => {
      if (loading) {
        return false;
      }

      try {
        const result = await resetApiKeyMutation({
          variables: {
            id: apiKeyId,
            team_id: teamId,
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
        setResetKey(result.data.reset_api_key.api_key);
        return true;
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
        return false;
      }
    },
    [loading, resetApiKeyMutation, teamId],
  );

  return (
    <>
      <ApiKeySecretModal
        apiKey={resetKey}
        isOpen={Boolean(resetKey)}
        onClose={() => setResetKey(null)}
        title="API key rotated"
        description="Your new API key is ready. Save it now because you won't be able to see it again."
      />

      <RotateKeyModal
        isOpen={rotateOpen}
        name={apiKey.name}
        loading={loading}
        setIsOpen={setRotateOpen}
        onConfirm={async () => {
          if (await resetAPIKey(apiKey.id)) setRotateOpen(false);
        }}
      />

      <div
        data-row-index={index}
        className="grid min-h-16 grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-b border-grey-100 px-5 py-3 last:border-b-0"
      >
        <div className="min-w-0">
          <div className="truncate font-world text-13 leading-5 font-medium text-grey-900">
            {apiKey.name}
          </div>

          <div className="flex min-w-0 items-center font-gta text-12 leading-4 text-grey-400">
            <span className="truncate">Created {timeAgo}</span>
            <span className="shrink-0">&nbsp;·&nbsp;</span>
            {isEnoughPermissions ? (
              <button
                type="button"
                onClick={() => setRotateOpen(true)}
                className="shrink-0 underline underline-offset-2 transition-colors hover:text-grey-700 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden"
              >
                Reset to view
              </button>
            ) : (
              <span className="shrink-0 underline underline-offset-2">
                Reset to view
              </span>
            )}
          </div>
        </div>

        <div className="flex">
          <Status isActive={apiKey.is_active} />
        </div>

        <div className="flex justify-end">
          {/* Every item here is OWNER-only in Hasura; don't ship dead DOM. */}
          {isEnoughPermissions ? (
            <div className="flex w-full justify-end">
              <Dropdown>
                <Dropdown.Button>
                  <MoreVerticalIcon />
                </Dropdown.Button>

                <Dropdown.List align="end" heading={apiKey.name} hideBackButton>
                  <Dropdown.ListItem asChild>
                    <button onClick={() => openViewDetails(apiKey)}>
                      <Dropdown.ListItemIcon asChild>
                        <EditIcon />
                      </Dropdown.ListItemIcon>

                      <Dropdown.ListItemText>Edit Key</Dropdown.ListItemText>
                    </button>
                  </Dropdown.ListItem>

                  <Dropdown.ListItem asChild>
                    <button onClick={() => setRotateOpen(true)}>
                      <Dropdown.ListItemIcon asChild>
                        <KeyIcon />
                      </Dropdown.ListItemIcon>

                      <Dropdown.ListItemText>Rotate key</Dropdown.ListItemText>
                    </button>
                  </Dropdown.ListItem>

                  <Dropdown.ListItem asChild>
                    <button onClick={() => openDeleteKeyModal(apiKey)}>
                      <Dropdown.ListItemIcon
                        className="text-system-error-600"
                        asChild
                      >
                        <TrashIcon />
                      </Dropdown.ListItemIcon>

                      <Dropdown.ListItemText className="text-system-error-600">
                        Remove key
                      </Dropdown.ListItemText>
                    </button>
                  </Dropdown.ListItem>
                </Dropdown.List>
              </Dropdown>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
