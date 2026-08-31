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
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMemo } from "react";
import { Status } from "./Status";
import { apiKeysTableColumnsClassName } from "../TableHeader";

export const ApiKeyRow = (props: {
  apiKey: FetchKeysQuery["api_key"][0];
  index: number;
  teamId: string;
  openViewDetails: (key: FetchKeysQuery["api_key"][0]) => void;
  openDeleteKeyModal: (key: FetchKeysQuery["api_key"][0]) => void;
  openRotateKeyModal: (key: FetchKeysQuery["api_key"][0]) => void;
}) => {
  const {
    apiKey,
    index,
    teamId,
    openViewDetails,
    openDeleteKeyModal,
    openRotateKeyModal,
  } = props;
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

  return (
    <div
      role="row"
      data-row-index={index}
      className={`grid h-12 ${apiKeysTableColumnsClassName} items-center border-b border-portal-border font-world text-15 leading-[1.2] font-[350] text-portal-ink last:border-b-0`}
    >
      <div role="cell" className="min-w-0 truncate px-4">
        {apiKey.name}
      </div>

      <div role="cell" className="min-w-0 truncate px-4">
        {timeAgo}
      </div>

      <div role="cell" className="flex min-w-0 px-4">
        <Status isActive={apiKey.is_active} />
      </div>

      <div role="cell" className="flex justify-end pr-4">
        {/* Every item here is OWNER-only in Hasura; don't ship dead DOM. */}
        {isEnoughPermissions ? (
          <Dropdown>
            <Dropdown.Button
              aria-label={`Manage ${apiKey.name}`}
              className="size-5 place-items-center rounded-full text-portal-ink transition-colors hover:bg-portal-border focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:outline-hidden"
            >
              <MoreVerticalIcon className="size-5" />
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
                <button onClick={() => openRotateKeyModal(apiKey)}>
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
        ) : null}
      </div>
    </div>
  );
};
