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
      <div className="flex h-[69px] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton width={32} height={32} circle inline />
          <div className="grid gap-0.5">
            <Skeleton width={112} height={18} />
            <Skeleton width={44} height={17} />
          </div>
        </div>

        <Skeleton width={20} height={20} borderRadius={6} />
      </div>
    );
  }

  return (
    <div className="flex h-[69px] items-center justify-between gap-4 px-4 transition-colors hover:bg-grey-25">
      <Button
        href={urls.teams({ team_id: item.team.id })}
        className="flex min-w-0 items-center gap-4 rounded-8 outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2"
      >
        <TeamLogo
          src=""
          name={item.team.name ?? "" /*FIXME: team.name must be non nullable*/}
        />
        <span className="grid min-w-0 gap-0.5 text-left">
          <span className="truncate font-world text-15 leading-[1.2] font-[350] text-portal-ink">
            {item.team.name ?? "" /*FIXME: team.name must be non nullable*/}
          </span>
          <span className="font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
            {roleName[item.role]}
          </span>
        </span>
      </Button>

      <div onClick={(event) => event.stopPropagation()}>
        <Dropdown>
          <Dropdown.Button
            aria-label={`Open actions for ${item.team.name ?? "team"}`}
            className="flex size-8 items-center justify-center rounded-8 text-portal-ink outline-hidden hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-grey-300"
          >
            <MoreVerticalIcon className="size-5" />
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
