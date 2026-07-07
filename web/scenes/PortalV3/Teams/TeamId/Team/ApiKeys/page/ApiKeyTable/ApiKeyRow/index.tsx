"use client";
import { Dropdown } from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ApiKeySecretModal } from "../../ApiKeySecretModal";
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
    async (apiKeyId: string) => {
      if (loading) {
        return;
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

        toast.success("API key was reset");

        if (!result.data?.reset_api_key?.api_key) {
          throw new Error("No API key returned");
        }

        setResetKey(result.data.reset_api_key.api_key);
      } catch (error) {
        let errorText = "Error occurred while resetting API key.";

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
    },
    [loading, resetApiKeyMutation, teamId],
  );

  return (
    <>
      <ApiKeySecretModal
        apiKey={resetKey}
        isOpen={Boolean(resetKey)}
        onClose={() => setResetKey(null)}
        title="API Key"
        description="Your new API key is ready. Save it now because you won't be able to see it again."
      />

      <div
        className={clsx(
          "max-md:grid max-md:grid-cols-[max-content_auto_auto_max-content] max-md:items-center max-md:gap-x-3 max-md:gap-y-1 max-md:rounded-2xl max-md:border max-md:border-grey-100 max-md:px-5 max-md:py-4 md:table-row",
        )}
      >
        <div
          key={`api_key_${index}_1`}
          className="group max-md:col-start-2 max-md:col-end-3 max-md:row-start-1 max-md:row-end-2 md:table-cell md:border-b md:border-grey-200 md:py-4 md:pl-2 md:pr-4"
        >
          <div className="grid">
            <Typography
              variant={TYPOGRAPHY.R3}
              as="div"
              className="truncate md:!leading-6"
            >
              {apiKey.name}
            </Typography>
          </div>
        </div>

        <div
          className="group max-md:col-start-3 max-md:col-end-4 max-md:row-start-1 max-md:row-end-3 max-md:text-end md:table-cell md:border-b md:border-grey-200 md:pr-4"
          key={`api_key${index}_2`}
        >
          <div className="inline-grid max-md:pl-8">
            <Typography
              variant={TYPOGRAPHY.R4}
              as="div"
              className="truncate md:!leading-6"
            >
              Reset to view
            </Typography>
          </div>
        </div>

        <div
          key={`api_key_${index}_3`}
          className="text-grey-500 max-md:col-start-2 max-md:col-end-3 max-md:row-start-2 max-md:row-end-3 max-md:table-cell md:table-cell md:border-b md:border-grey-200 md:pr-4"
        >
          <div className="grid">
            <Typography
              variant={TYPOGRAPHY.R4}
              as="div"
              className="max-md:truncate md:whitespace-nowrap md:!leading-6"
            >
              {timeAgo}
            </Typography>
          </div>
        </div>

        <div
          key={`api_key_${index}_4`}
          className="text-grey-500 max-md:col-start-1 max-md:col-end-2 max-md:row-start-1 max-md:row-end-3 max-md:table-cell md:table-cell md:border-b md:border-grey-200 md:pr-4 md:align-middle"
        >
          <Typography variant={TYPOGRAPHY.R4}>
            <Status isActive={apiKey.is_active} />
          </Typography>
        </div>

        <div className="max-md:col-start-4 max-md:col-end-5 max-md:row-start-1 max-md:row-end-3 max-md:pl-2 md:table-cell md:border-b md:border-grey-200 md:pl-4 md:pr-2 md:align-middle">
          <div
            key={`api_key_${index}_5`}
            className={clsx("flex w-full justify-end", {
              hidden: !isEnoughPermissions,
            })}
          >
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
                  <button onClick={() => resetAPIKey(apiKey.id)}>
                    <Dropdown.ListItemIcon asChild>
                      <KeyIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>Reset key</Dropdown.ListItemText>
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
        </div>
      </div>
    </>
  );
};
