import clsx from "clsx";
import { FetchTeamMembersQuery } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { getNullifierName } from "@/lib/utils";
import { UserLogo } from "./UserLogo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Dropdown } from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { EditUserIcon } from "@/components/Icons/EditUserIcon";
import { SendIcon } from "@/components/Icons/SendIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Role_Enum } from "@/graphql/graphql";
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
  onResendInvite?: () => void;
  onCancelInvite?: () => void;
};

export const Item = (props: ItemProps) => {
  const { item, isCurrent, isEnoughPermissions } = props;
  const isInviteRow = item?.id.startsWith("inv_");
  const name =
    item?.user?.name ||
    item?.user?.email ||
    getNullifierName(item?.user?.world_id_nullifier) ||
    "Anonymous User";

  return (
    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-b border-grey-100 px-5 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        {!item ? (
          <Skeleton className="size-8 leading-normal" circle inline />
        ) : (
          <UserLogo src={""} name={name} className="size-8" />
        )}

        <div className="min-w-0">
          <Typography
            variant={TYPOGRAPHY.S3}
            className="block max-w-full truncate text-13 text-grey-900"
          >
            {!item ? <Skeleton width={120} inline /> : name}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="mt-0.5 block max-w-full truncate text-grey-400"
          >
            {!item ? <Skeleton width={100} inline /> : item.user?.email ?? ""}
          </Typography>
        </div>
      </div>

      <div className="flex">
        {!item ? (
          <Skeleton width={60} height={24} borderRadius={999} />
        ) : (
          <span className="rounded-full border border-grey-200 px-2.5 py-1 font-world text-12 leading-4 font-medium text-grey-500">
            {roleName[item.role]}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        {!item ? (
          <div className="flex size-8 items-center justify-center">
            <MoreVerticalIcon className="text-grey-400" />
          </div>
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

            <Dropdown.List
              align="end"
              heading={name} // TODO: replace heading with member card in separate task
            >
              {isEnoughPermissions && !isInviteRow && (
                <Dropdown.ListItem asChild>
                  <button onClick={props.onEdit}>
                    <Dropdown.ListItemIcon asChild>
                      <EditUserIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>Edit role</Dropdown.ListItemText>
                  </button>
                </Dropdown.ListItem>
              )}

              {isEnoughPermissions && isInviteRow && (
                <Dropdown.ListItem asChild>
                  <button onClick={props.onResendInvite}>
                    <Dropdown.ListItemIcon asChild>
                      <SendIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>
                      Re-send invite
                    </Dropdown.ListItemText>
                  </button>
                </Dropdown.ListItem>
              )}

              {isEnoughPermissions && (
                <Dropdown.ListItem className="text-system-error-600" asChild>
                  <button
                    onClick={() =>
                      isInviteRow
                        ? props.onCancelInvite?.()
                        : props.onRemove?.()
                    }
                  >
                    <Dropdown.ListItemIcon
                      className="text-system-error-600"
                      asChild
                    >
                      <TrashIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>
                      {isInviteRow ? "Cancel invite" : "Remove member"}
                    </Dropdown.ListItemText>
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
