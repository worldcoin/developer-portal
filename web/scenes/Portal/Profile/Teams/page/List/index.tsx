"use client";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { Dropdown } from "@/components/Dropdown";
import { Button } from "@/components/Button";
import { EditIcon } from "@/components/Icons/EditIcon";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { urls } from "@/lib/urls";
import { LeaveTeamDialog } from "@/scenes/Portal/Profile/Teams/page/LeaveTeamDialog";
import { TransferTeamDialog } from "@/scenes/Portal/Profile/Teams/page/TransferTeamDialog";
import { DeleteTeamDialog } from "@/scenes/Portal/common/DeleteTeamDialog";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeQuery } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useState } from "react";
import { TeamLogo } from "./TeamLogo";
import Link from "next/link";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

type Team = NonNullable<FetchMeQuery["user_by_pk"]>["memberships"][0]["team"];

export const List = () => {
  const [teamForTransfer, setTeamForTransfer] = useState<Team | undefined>();
  const [teamForDelete, setTeamForDelete] = useState<Team | undefined>();
  const [teamForLeave, setTeamForLeave] = useState<Team | undefined>();

  const { user } = useMeQuery();

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto] ">
        <div className="contents text-12 leading-4 text-grey-400">
          <Typography
            variant={TYPOGRAPHY.R5}
            className="border-b border-grey-100 py-3"
          >
            Team
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="border-b border-grey-100 py-3"
          >
            Role
          </Typography>

          <div className="border-b border-grey-100 py-3" />
        </div>

        {user?.memberships?.map((membership) => (
          <div key={membership.team.id} className="group contents max-w-full">
            <Button
              href={urls.teams({ team_id: membership.team.id })}
              className="flex items-center gap-x-4 border-b border-grey-100 px-2 py-4 group-hover:bg-grey-50"
            >
              <TeamLogo
                src={""}
                name={
                  membership.team.name ??
                  "" /*FIXME: team.name must be non nullable*/
                }
              />

              <Typography
                variant={TYPOGRAPHY.R3}
                className="max-w-[50px] truncate sm:max-w-[250px] md:max-w-[400px]"
              >
                {
                  membership.team.name ??
                    "" /*FIXME: team.name must be non nullable*/
                }
              </Typography>
            </Button>

            <Typography
              variant={TYPOGRAPHY.R4}
              className="flex items-center border-b border-grey-100 py-4 text-14 leading-5 text-grey-500 group-hover:bg-grey-50"
            >
              {roleName[membership.role]}
            </Typography>

            <div className="flex items-center border-b border-grey-100 px-2 py-4 group-hover:bg-grey-50">
              <Dropdown>
                <Dropdown.Button className="rounded-8 hover:bg-grey-100">
                  <MoreVerticalIcon />
                </Dropdown.Button>

                <Dropdown.List
                  align="end"
                  heading={membership.team.name ?? ""} // TODO: replace header with team card in separate task
                  hideBackButton
                >
                  <Dropdown.ListItem asChild>
                    <Link href={urls.teams({ team_id: membership.team.id })}>
                      <Dropdown.ListItemIcon asChild>
                        <LoginSquareIcon />
                      </Dropdown.ListItemIcon>

                      <Dropdown.ListItemText>
                        Switch to team
                      </Dropdown.ListItemText>
                    </Link>
                  </Dropdown.ListItem>

                  {(membership.role === Role_Enum.Owner ||
                    membership.role === Role_Enum.Admin) && (
                    <Dropdown.ListItem asChild>
                      <Link
                        href={urls.teamSettings({
                          team_id: membership.team.id,
                        })}
                      >
                        <Dropdown.ListItemIcon asChild>
                          <EditIcon />
                        </Dropdown.ListItemIcon>

                        <Dropdown.ListItemText>Edit team</Dropdown.ListItemText>
                      </Link>
                    </Dropdown.ListItem>
                  )}

                  {membership.role === Role_Enum.Owner && (
                    <Dropdown.ListItem asChild>
                      <button
                        type="button"
                        onClick={() => setTeamForTransfer(membership.team)}
                      >
                        <Dropdown.ListItemIcon asChild>
                          <ExchangeIcon />
                        </Dropdown.ListItemIcon>

                        <Dropdown.ListItemText>
                          Transfer ownership
                        </Dropdown.ListItemText>
                      </button>
                    </Dropdown.ListItem>
                  )}

                  {membership.role === Role_Enum.Owner && (
                    <Dropdown.ListItem
                      className="text-system-error-600"
                      asChild
                    >
                      <button
                        type="button"
                        onClick={() => setTeamForDelete(membership.team)}
                      >
                        <Dropdown.ListItemIcon
                          className="text-system-error-600"
                          asChild
                        >
                          <LogoutIcon />
                        </Dropdown.ListItemIcon>

                        <Dropdown.ListItemText>
                          Delete team
                        </Dropdown.ListItemText>
                      </button>
                    </Dropdown.ListItem>
                  )}

                  {(membership.role === Role_Enum.Admin ||
                    membership.role === Role_Enum.Member) && (
                    <Dropdown.ListItem
                      className="text-system-error-600"
                      asChild
                    >
                      <button
                        type="button"
                        onClick={() => setTeamForLeave(membership.team)}
                      >
                        <Dropdown.ListItemIcon
                          className="text-system-error-600"
                          asChild
                        >
                          <LogoutIcon />
                        </Dropdown.ListItemIcon>

                        <Dropdown.ListItemText>
                          Leave team
                        </Dropdown.ListItemText>
                      </button>
                    </Dropdown.ListItem>
                  )}
                </Dropdown.List>
              </Dropdown>
            </div>
          </div>
        ))}
      </div>

      <DeleteTeamDialog
        open={!!teamForDelete}
        onClose={() => setTeamForDelete(undefined)}
        team={{
          id: teamForDelete?.id,
          name: teamForDelete?.name,
        }}
      />

      <LeaveTeamDialog
        team={teamForLeave}
        open={!!teamForLeave}
        onClose={() => setTeamForLeave(undefined)}
      />

      <TransferTeamDialog
        team={teamForTransfer}
        open={!!teamForTransfer}
        onClose={() => setTeamForTransfer(undefined)}
      />
    </>
  );
};
