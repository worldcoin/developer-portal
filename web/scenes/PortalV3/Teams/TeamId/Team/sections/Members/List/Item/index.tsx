import clsx from "clsx";
import { FetchTeamMembersQuery } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { getNullifierName } from "@/lib/utils";
import { UserLogo } from "./UserLogo";
import { Dropdown } from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { EditUserIcon } from "@/components/Icons/EditUserIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Role_Enum } from "@/graphql/graphql";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

type ItemProps = {
  item?: FetchTeamMembersQuery["members"][number];
  isCurrent?: boolean;
  isEnoughPermissions?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  onCancelInvite?: () => void;
};

export const Item = (props: ItemProps) => {
  const { item, isCurrent, isEnoughPermissions } = props;
  const isInviteRow = item?.id.startsWith("inv_");
  const primaryLabel =
    item?.user?.email ||
    item?.user?.name ||
    getNullifierName(item?.user?.world_id_nullifier) ||
    "Anonymous User";

  return (
    <div className="flex min-h-[71px] w-full min-w-0 items-center justify-between gap-4 rounded-[10px] border border-portal-border p-4">
      <div className="flex min-w-0 items-center gap-4">
        {!item ? (
          <Skeleton className="size-8 leading-normal" circle inline />
        ) : (
          <UserLogo src={""} name={primaryLabel} className="size-8" />
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="block max-w-full truncate font-world text-15 leading-[1.2] font-[450] text-portal-ink">
            {!item ? <Skeleton width={180} inline /> : primaryLabel}
          </span>
          <span
            className={clsx(
              "block max-w-full truncate font-world text-13 leading-[1.3] font-[350]",
              isInviteRow ? "text-[#ffae00]" : "text-[#7d7d7d]",
            )}
          >
            {!item ? (
              <Skeleton width={60} inline />
            ) : isInviteRow ? (
              "Pending invitation"
            ) : (
              roleName[item.role]
            )}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 justify-end">
        {!item ? (
          <div className="flex size-8 items-center justify-center">
            <MoreVerticalIcon className="text-grey-400" />
          </div>
        ) : isInviteRow ? (
          <button
            type="button"
            aria-label={`Cancel invitation for ${primaryLabel}`}
            onClick={props.onCancelInvite}
            disabled={!isEnoughPermissions || !props.onCancelInvite}
            className={clsx(
              "flex size-5 items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
              {
                "pointer-events-none invisible": !isEnoughPermissions,
              },
            )}
          >
            <Image
              src="/icons/pending-invite-trash.svg"
              width={20}
              height={20}
              alt=""
              aria-hidden
              className="size-5"
            />
          </button>
        ) : (
          <Dropdown>
            <Dropdown.Button
              disabled={!isEnoughPermissions || isCurrent}
              className={clsx("rounded-8 hover:bg-grey-100", {
                "pointer-events-none invisible":
                  !isEnoughPermissions || isCurrent,
              })}
            >
              <MoreVerticalIcon className="text-grey-900" />
            </Dropdown.Button>

            <Dropdown.List align="end" heading={primaryLabel}>
              {isEnoughPermissions && (
                <Dropdown.ListItem asChild>
                  <button onClick={props.onEdit}>
                    <Dropdown.ListItemIcon asChild>
                      <EditUserIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>Edit role</Dropdown.ListItemText>
                  </button>
                </Dropdown.ListItem>
              )}

              {isEnoughPermissions && (
                <Dropdown.ListItem className="text-system-error-600" asChild>
                  <button onClick={props.onRemove}>
                    <Dropdown.ListItemIcon
                      className="text-system-error-600"
                      asChild
                    >
                      <TrashIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>Remove member</Dropdown.ListItemText>
                  </button>
                </Dropdown.ListItem>
              )}
            </Dropdown.List>
          </Dropdown>
        )}
      </div>
    </div>
  );
};
