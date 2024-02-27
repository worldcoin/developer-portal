"use client";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { formatDistanceToNowStrict } from "date-fns";
import { FetchKeysQuery } from "../../graphql/client/fetch-keys.generated";

import { DecoratedButton } from "@/components/DecoratedButton";
import { EditIcon } from "@/components/Icons/EditIcon";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { ApolloError } from "@apollo/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Status } from "./Status";
import { useResetApiKeyMutation } from "./graphql/client/reset-api-key.generated";

export const ApiKeyRow = (props: {
  apiKey: FetchKeysQuery["api_key"][0];
  index: number;
  teamId: string;
  openViewDetails: (key: FetchKeysQuery["api_key"][0]) => void;
  openDeleteKeyModal: (key: FetchKeysQuery["api_key"][0]) => void;
}) => {
  const { apiKey, index, teamId, openViewDetails, openDeleteKeyModal } = props;
  const [secretKey, setSecretKey] = useState<string | null>(null);
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

  const [resetApiKeyMutation, { loading }] = useResetApiKeyMutation();

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(secretKey ?? "");
    toast.success("Copied to clipboard");
  }, [secretKey]);

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
        });

        if (result instanceof Error || Boolean(result?.errors)) {
          throw result;
        }

        toast.success("API key was reset");

        if (!result.data?.reset_api_key?.api_key) {
          throw new Error("No API key returned");
        }

        setSecretKey(result.data?.reset_api_key?.api_key);
      } catch (error) {
        let errorText = "Error occurred while resetting API key.";

        if (error instanceof ApolloError) {
          for (let graphQLError of error.graphQLErrors) {
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
    <tr className={clsx("w-full text-xs text-grey-500 hover:bg-grey-25")}>
      <td key={`api_key_${index}_1`} className="group w-auto px-2 py-4">
        <Typography
          variant={TYPOGRAPHY.R3}
          as="div"
          className="max-w-44 truncate"
        >
          {apiKey.name}
        </Typography>
      </td>

      <td
        className="group w-auto max-w-96 break-all pr-3"
        key={`api_key${index}_2`}
      >
        <Typography
          variant={TYPOGRAPHY.R3}
          as="div"
          className="overflow-wrap break-word grid grid-cols-auto/1fr items-center justify-start justify-items-start gap-x-4 py-2 text-grey-500"
        >
          <Typography variant={TYPOGRAPHY.R4}>
            {secretKey ?? "api_" + btoa(apiKey.id).substring(0, 15) + "..."}
          </Typography>
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={copyKey}
            className={clsx(
              "whitespace-nowrap rounded-lg px-5 py-2 transition-opacity duration-300 md:opacity-0",
              { "opacity-100 md:group-hover:opacity-100": secretKey },
            )}
          >
            <Typography variant={TYPOGRAPHY.M4}>Copy</Typography>
          </DecoratedButton>
        </Typography>
      </td>

      <td key={`api_key_${index}_3`} className="text-grey-500">
        <Typography variant={TYPOGRAPHY.R4}>{timeAgo}</Typography>
      </td>

      <td key={`api_key_${index}_4`} className="text-grey-500">
        <Typography variant={TYPOGRAPHY.R4}>
          <Status isActive={apiKey.is_active} />
        </Typography>
      </td>

      <td>
        <div
          key={`api_key_${index}_5`}
          className={clsx("flex w-full justify-end px-2", {
            hidden: !isEnoughPermissions,
          })}
        >
          <Dropdown>
            <DropdownButton>
              <MoreVerticalIcon />
            </DropdownButton>
            <DropdownItems>
              <DropdownItem
                className="hover:bg-grey-50"
                onClick={() => openViewDetails(apiKey)}
              >
                <div className="grid w-full grid-cols-auto/1fr items-center justify-between gap-x-2">
                  <EditIcon className="w-5 text-grey-400" />
                  <Typography variant={TYPOGRAPHY.R4}>Edit Key</Typography>
                </div>
              </DropdownItem>
              <DropdownItem
                className="hover:bg-grey-50"
                onClick={() => resetAPIKey(apiKey.id)}
              >
                <div className="grid w-full grid-cols-auto/1fr items-center justify-between gap-x-2">
                  <KeyIcon className="w-5 text-grey-400" />
                  <Typography variant={TYPOGRAPHY.R4}>Reset key</Typography>
                </div>
              </DropdownItem>

              <DropdownItem
                className="text-system-error-600 hover:bg-grey-50"
                onClick={() => openDeleteKeyModal(apiKey)}
              >
                <div className="grid w-full grid-cols-auto/1fr items-center justify-between gap-x-2">
                  <TrashIcon className="w-5" />
                  <Typography as="div" variant={TYPOGRAPHY.R4}>
                    Remove key
                  </Typography>
                </div>
              </DropdownItem>
            </DropdownItems>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
};
