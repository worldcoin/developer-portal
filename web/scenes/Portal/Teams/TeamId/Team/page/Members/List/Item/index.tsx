import clsx from "clsx";
import { FetchTeamMembersQuery } from "../../graphql/client/fetch-team-members.generated";
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
import { getMemberRowActions } from "../member-row-actions";

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
    <div
      className={clsx(
        "max-md:mt-2 max-md:grid max-md:grid-cols-[max-content_auto_max-content] max-md:items-center max-md:rounded-2xl max-md:border max-md:border-grey-100 md:contents",
        {
          "max-md:order-1": isInviteRow,
          "max-md:order-2": !isInviteRow,
        },
      )}
    >
      <div className="p-4 md:pl-2">
        {!item ? (
          <Skeleton className="size-12 leading-normal" circle inline />
        ) : (
          <UserLogo src={""} name={name} />
        )}
      </div>

      <div className="grid gap-y-0.5">
        <Typography
          variant={TYPOGRAPHY.R3}
          className="max-w-full truncate text-grey-900"
        >
          {!item ? <Skeleton width={200} inline /> : name}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="inline-grid grid-cols-[auto_1fr]  text-grey-500"
        >
          {!item ? (
            <Skeleton width={150} inline />
          ) : (
            <>
              <div className="md:hidden">
                {roleName[item.role]}&nbsp;•&nbsp;
              </div>

              <div className="truncate">{item.user?.email ?? ""}</div>
            </>
          )}
        </Typography>
      </div>

      <div className="flex pr-4 text-grey-500 max-md:hidden">
        <Typography variant={TYPOGRAPHY.R4}>
          {!item ? <Skeleton width={100} inline /> : roleName[item.role]}
        </Typography>
      </div>

      <div className="flex pr-4 max-md:hidden">
        {isInviteRow && (
          <div className="mx-2 rounded-full bg-system-warning-100 px-3 py-1 text-center">
            <Typography
              variant={TYPOGRAPHY.S3}
              className="text-system-warning-500"
            >
              Pending invite
            </Typography>
          </div>
        )}
      </div>

      <div className="pr-2 max-md:pr-4">
        {!item ? (
          <div className="flex size-8 items-center justify-center">
            <MoreVerticalIcon className="text-grey-400" />
          </div>
        ) : (
          <Dropdown>
            <Dropdown.Button
              className="rounded-8 hover:bg-grey-100"
              aria-label="Member actions"
            >
              <MoreVerticalIcon className="text-grey-900" />
            </Dropdown.Button>

            <Dropdown.List align="end" heading={name}>
              {getMemberRowActions({
                isOwner: Boolean(isEnoughPermissions),
                isCurrent: Boolean(isCurrent),
                isInviteRow: Boolean(isInviteRow),
              }).map((action) => {
                const handlers: Record<string, (() => void) | undefined> = {
                  edit_member_role: props.onEdit,
                  remove_member: props.onRemove,
                  resend_invite: props.onResendInvite,
                  cancel_invite: props.onCancelInvite,
                };

                const Icon =
                  action.key === "edit_member_role"
                    ? EditUserIcon
                    : action.key === "resend_invite"
                      ? SendIcon
                      : TrashIcon;

                if (!action.allowed) {
                  return (
                    <Dropdown.DisabledListItem
                      key={action.key}
                      icon={<Icon />}
                      description={action.reason}
                    >
                      {action.label}
                    </Dropdown.DisabledListItem>
                  );
                }

                return (
                  <Dropdown.ListItem
                    key={action.key}
                    className={
                      action.danger ? "text-system-error-600" : undefined
                    }
                    asChild
                  >
                    <button type="button" onClick={handlers[action.key]}>
                      <Dropdown.ListItemIcon
                        className={
                          action.danger ? "text-system-error-600" : undefined
                        }
                        asChild
                      >
                        <Icon />
                      </Dropdown.ListItemIcon>
                      <Dropdown.ListItemText>
                        {action.label}
                      </Dropdown.ListItemText>
                    </button>
                  </Dropdown.ListItem>
                );
              })}
            </Dropdown.List>
          </Dropdown>
        )}
      </div>

      <hr className="col-span-full border-grey-100 max-md:hidden" />
    </div>
  );
};
