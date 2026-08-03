import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { EditIcon } from "@/components/Icons/EditIcon";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { Role_Enum } from "@/graphql/graphql";
import { urls } from "@/lib/urls";
import { TeamLogo } from "@/scenes/PortalV3/Profile/Teams/page/List/TeamLogo";
import { FetchMeQuery } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

type Item = NonNullable<FetchMeQuery["user_by_pk"]>["memberships"][0];

type ItemsProps = {
  item?: Item;
  onClickTransfer?: () => void;
  onClickDelete?: () => void;
  onClickLeave?: () => void;
};

export const Item = (props: ItemsProps) => {
  const { item } = props;

  if (!item) {
    return (
      <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-grey-100 px-5 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton width={28} height={28} circle inline />
          <Skeleton width={160} />
        </div>
        <Skeleton width={56} height={24} borderRadius={999} />
        <div className="flex size-8 items-center justify-center text-grey-400">
          <MoreVerticalIcon />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-grey-100 px-5 py-3 transition-colors hover:bg-grey-25 md:px-6">
      <Button
        href={urls.teams({ team_id: item.team.id })}
        className="flex min-w-0 items-center gap-3 rounded-8 outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2"
      >
        <TeamLogo
          src=""
          name={item.team.name ?? "" /*FIXME: team.name must be non nullable*/}
        />
        <span className="truncate font-world text-13 leading-5 font-medium text-portal-text">
          {item.team.name ?? "" /*FIXME: team.name must be non nullable*/}
        </span>
      </Button>

      <span className="rounded-full border border-grey-200 bg-white px-2.5 py-1 font-world text-12 leading-none text-grey-500">
        {roleName[item.role]}
      </span>

      <div onClick={(event) => event.stopPropagation()}>
        <Dropdown>
          <Dropdown.Button
            aria-label={`Open actions for ${item.team.name ?? "team"}`}
            className="flex size-8 items-center justify-center rounded-8 text-grey-500 outline-hidden hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-grey-300"
          >
            <MoreVerticalIcon />
          </Dropdown.Button>

          <Dropdown.List
            align="end"
            heading={item.team.name ?? ""} // TODO: replace header with team card in separate task
            hideBackButton
          >
            <Dropdown.ListItem asChild>
              <Link href={urls.teams({ team_id: item.team.id })}>
                <Dropdown.ListItemIcon asChild>
                  <LoginSquareIcon />
                </Dropdown.ListItemIcon>

                <Dropdown.ListItemText>Switch to team</Dropdown.ListItemText>
              </Link>
            </Dropdown.ListItem>

            {(item.role === Role_Enum.Owner ||
              item.role === Role_Enum.Admin) && (
              <Dropdown.ListItem asChild>
                <Link
                  href={urls.teamSettings({
                    team_id: item.team.id,
                    return_to: urls.profile(),
                  })}
                >
                  <Dropdown.ListItemIcon asChild>
                    <EditIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>Edit team</Dropdown.ListItemText>
                </Link>
              </Dropdown.ListItem>
            )}

            {item.role === Role_Enum.Owner && (
              <Dropdown.ListItem asChild>
                <button type="button" onClick={props.onClickTransfer}>
                  <Dropdown.ListItemIcon asChild>
                    <ExchangeIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>
                    Transfer ownership
                  </Dropdown.ListItemText>
                </button>
              </Dropdown.ListItem>
            )}

            {item.role === Role_Enum.Owner && (
              <Dropdown.ListItem className="text-system-error-600" asChild>
                <button type="button" onClick={props.onClickDelete}>
                  <Dropdown.ListItemIcon
                    className="text-system-error-600"
                    asChild
                  >
                    <LogoutIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>Delete team</Dropdown.ListItemText>
                </button>
              </Dropdown.ListItem>
            )}

            {(item.role === Role_Enum.Admin ||
              item.role === Role_Enum.Member) && (
              <Dropdown.ListItem className="text-system-error-600" asChild>
                <button type="button" onClick={props.onClickLeave}>
                  <Dropdown.ListItemIcon
                    className="text-system-error-600"
                    asChild
                  >
                    <LogoutIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>Leave team</Dropdown.ListItemText>
                </button>
              </Dropdown.ListItem>
            )}
          </Dropdown.List>
        </Dropdown>
      </div>
    </div>
  );
};
