import clsx from "clsx";
import { urls } from "@/lib/urls";
import { TeamLogo } from "@/scenes/Portal/Profile/Teams/page/List/TeamLogo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Dropdown } from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import Link from "next/link";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { Role_Enum } from "@/graphql/graphql";
import { EditIcon } from "@/components/Icons/EditIcon";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { Button } from "@/components/Button";
import { FetchMeQuery } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { ReactNode } from "react";
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

  const componentProps = !item
    ? {
        type: "button",
      }
    : {
        href: urls.teams({ team_id: item.team.id }),
      };

  const Component = (props: { className: string; children: ReactNode }) => {
    if (item) {
      return (
        <Button
          className={props.className}
          href={urls.teams({ team_id: item.team.id })}
        >
          {props.children}
        </Button>
      );
    }
    return (
      <Button className={props.className} type="button">
        {props.children}
      </Button>
    );
  };

  return (
    (<Component
      className={clsx(
        "md:group rounded-2xl border border-grey-100 max-md:grid max-md:grid-cols-[1fr_auto] md:contents md:max-w-full",
        {
          "cursor-default": !item,
          "cursor-pointer": !!item,
        },
      )}
    >
      <div className="max-md:grid max-md:grid-cols-auto/1fr/auto max-md:items-center max-md:gap-x-4 max-md:p-4 md:contents">
        <div className="md:py-4 md:pr-4">
          {!item ? (
            <Skeleton className="size-12 rounded-lg leading-normal" inline />
          ) : (
            <TeamLogo
              src={""}
              name={
                item.team.name ?? "" /*FIXME: team.name must be non nullable*/
              }
            />
          )}
        </div>

        <div className="max-md:grid max-md:gap-y-1 md:contents">
          <div className="truncate group-hover:bg-grey-50 md:grid md:items-center md:self-stretch">
            <Typography
              variant={TYPOGRAPHY.R3}
              className="truncate leading-6 group-hover:bg-grey-50 md:pr-4 md:leading-5"
            >
              {!item ? (
                <Skeleton width={200} />
              ) : (
                (item.team.name ?? "") /*FIXME: team.name must be non nullable*/
              )}
            </Typography>
          </div>

          <div className="truncate group-hover:bg-grey-50 md:grid md:items-center md:self-stretch">
            <Typography
              variant={TYPOGRAPHY.R4}
              className="truncate text-14 leading-5 text-grey-500 md:py-4"
            >
              {!item ? <Skeleton width={100} /> : roleName[item.role]}
            </Typography>
          </div>
        </div>

        <div
          className="group-hover:bg-grey-50 md:px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!item ? (
            <div className="flex size-8 items-center justify-center">
              <MoreVerticalIcon className="text-grey-400" />
            </div>
          ) : (
            <Dropdown>
              <Dropdown.Button className="rounded-8 hover:bg-grey-100">
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

                    <Dropdown.ListItemText>
                      Switch to team
                    </Dropdown.ListItemText>
                  </Link>
                </Dropdown.ListItem>

                {(item.role === Role_Enum.Owner ||
                  item.role === Role_Enum.Admin) && (
                  <Dropdown.ListItem asChild>
                    <Link
                      href={urls.teamSettings({
                        team_id: item.team.id,
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
          )}
        </div>
      </div>
      <hr className="max-md:hidden md:col-span-4 md:border-t md:border-grey-100" />
    </Component>)
  );
};
