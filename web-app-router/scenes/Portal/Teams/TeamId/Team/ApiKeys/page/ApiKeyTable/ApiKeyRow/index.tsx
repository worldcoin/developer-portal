"use client";
import { formatDistanceToNowStrict } from "date-fns";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  FetchKeysDocument,
  FetchKeysQuery,
} from "../../graphql/client/fetch-keys.generated";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";

import { Status } from "./Status";
import { EditIcon } from "@/components/Icons/EditIcon";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import clsx from "clsx";
import React, { useCallback, useState } from "react";
import { useResetApiKeyMutation } from "./graphql/client/reset-api-key.generated";
import { toast } from "react-toastify";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useDeleteKeyMutation } from "../DeleteKeyModal/graphql/client/delete-key.generated";

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

  const [resetApiKeyMutation] = useResetApiKeyMutation({
    context: { headers: { team_id: teamId } },
  });

  const [deleteApiKeyMutation] = useDeleteKeyMutation({
    context: { headers: { team_id: teamId } },
  });

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(secretKey ?? "");
    toast.success("Copied to clipboard");
  }, [secretKey]);

  const resetAPIKey = useCallback(
    async (apiKeyId: string) => {
      try {
        const result = await resetApiKeyMutation({
          variables: {
            id: apiKeyId,
          },
        });
        if (result instanceof Error) {
          throw result;
        }
        toast.success("API key was reset");
        if (!result.data?.reset_api_key?.api_key) {
          throw new Error("No API key returned");
        }
        setSecretKey(result.data?.reset_api_key?.api_key);
      } catch (error) {
        console.error(error);
        toast.error("Error occurred while resetting API key.");
      }
    },
    [resetApiKeyMutation]
  );

  const deleteAPIKey = useCallback(
    async (apiKeyId: string) => {
      try {
        const result = await deleteApiKeyMutation({
          variables: {
            id: apiKeyId,
          },
          refetchQueries: [FetchKeysDocument],
        });
        if (result instanceof Error) {
          throw result;
        }
        toast.success("API key was deleted");
      } catch (error) {
        console.error(error);
        toast.error("Error occurred while deleting API key.");
      }
    },
    [deleteApiKeyMutation]
  );

  return (
    <tr className={clsx("hover:bg-grey-25 text-grey-500 text-xs w-full")}>
      <td key={`api_key_${index}_1`} className="px-2 group py-4 w-auto">
        <Typography
          variant={TYPOGRAPHY.R3}
          as="div"
          className="truncate max-w-44"
        >
          {apiKey.name}
        </Typography>
      </td>
      <td className="group break-all max-w-96 pr-3" key={`api_key${index}_2`}>
        <Typography
          variant={TYPOGRAPHY.R3}
          as="div"
          className=" text-grey-500 grid grid-cols-auto/1fr gap-x-4 justify-start items-center justify-items-start overflow-wrap break-word py-2"
        >
          <Typography variant={TYPOGRAPHY.R4}>
            {secretKey ?? "api_" + btoa(apiKey.id).substring(0, 15) + "..."}
          </Typography>
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={copyKey}
            className={clsx(
              "py-2 px-5 rounded-lg opacity-0 transition-opacity duration-300 whitespace-nowrap",
              { "group-hover:opacity-100": secretKey }
            )}
          >
            <Typography variant={TYPOGRAPHY.M4}>Copy</Typography>
          </DecoratedButton>
        </Typography>
      </td>

      <td key={`api_key${index}_3`} className="text-grey-500">
        <Typography variant={TYPOGRAPHY.R4}>{timeAgo}</Typography>
      </td>

      <td key={`api_key${index}_4`} className="text-grey-500">
        <Typography variant={TYPOGRAPHY.R4}>
          <Status isActive={apiKey.is_active} />
        </Typography>
      </td>
      <td>
        <div
          key={`api_key_${index}_5`}
          className="w-full flex justify-end px-2"
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
                <div className="grid grid-cols-auto/1fr items-center justify-between w-full gap-x-2">
                  <EditIcon className="text-grey-400 w-5" />
                  <Typography variant={TYPOGRAPHY.R4}>View Details</Typography>
                </div>
              </DropdownItem>
              <DropdownItem
                className="hover:bg-grey-50"
                onClick={async () => await resetAPIKey(apiKey.id)}
              >
                <div className="grid grid-cols-auto/1fr items-center justify-between w-full gap-x-2">
                  <KeyIcon className="text-grey-400 w-5" />
                  <Typography variant={TYPOGRAPHY.R4}>Reset key</Typography>
                </div>
              </DropdownItem>

              <DropdownItem
                className="text-system-error-600 hover:bg-grey-50"
                onClick={() => openDeleteKeyModal(apiKey)}
              >
                <div className="grid grid-cols-auto/1fr items-center justify-between w-full gap-x-2">
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
