"use client";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";

import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";

import { EditIcon } from "@/components/Icons/EditIcon";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { DeleteTeamDialog } from "@/scenes/Portal/Profile/Teams/page/DeleteTeamDialog";
import { EditTeamDialog } from "@/scenes/Portal/Profile/Teams/page/EditTeamDialog";
import { LeaveTeamDialog } from "@/scenes/Portal/Profile/Teams/page/LeaveTeamDialog";
import { TransferTeamDialog } from "@/scenes/Portal/Profile/Teams/page/TransferTeamDialog";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import {
  FetchMembershipsQuery,
  useFetchMembershipsQuery,
} from "../graphql/client/fetch-memberships.generated";
import { TeamLogo } from "./TeamLogo";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

export const List = () => {
  const { user } = useUser() as Auth0SessionUser;

  const membershipsQueryRes = useFetchMembershipsQuery({
    context: { headers: { team_id: "_" } },
    variables: !user?.hasura
      ? undefined
      : {
          user_id: user?.hasura.id,
        },
    skip: !user?.hasura,
  });

  const [teamForEdit, setTeamForEdit] = useState<
    FetchMembershipsQuery["memberships"][0]["team"] | undefined
  >();
  const [teamForTransfer, setTeamForTransfer] = useState<
    FetchMembershipsQuery["memberships"][0]["team"] | undefined
  >();
  const [teamForDelete, setTeamForDelete] = useState<
    FetchMembershipsQuery["memberships"][0]["team"] | undefined
  >();
  const [teamForLeave, setTeamForLeave] = useState<
    FetchMembershipsQuery["memberships"][0]["team"] | undefined
  >();

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto]">
        <div className="contents text-12 leading-4 text-grey-400">
          <Typography
            variant={TYPOGRAPHY.R5}
            className="border-b border-grey-100 py-3"
          >
            Member
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="border-b border-grey-100 py-3"
          >
            Role
          </Typography>

          <div className="border-b border-grey-100 py-3" />
        </div>

        {membershipsQueryRes.data?.memberships.map((membership) => (
          <div key={membership.team.id} className="contents">
            <div className="flex items-center gap-x-4 border-b border-grey-100 px-2 py-4">
              <TeamLogo
                src={""}
                name={
                  membership.team.name ??
                  "" /*FIXME: team.name must be non nullable*/
                }
              />

              <Typography variant={TYPOGRAPHY.R3}>
                {
                  membership.team.name ??
                    "" /*FIXME: team.name must be non nullable*/
                }
              </Typography>
            </div>

            <Typography
              variant={TYPOGRAPHY.R4}
              className="flex items-center border-b border-grey-100 px-2 py-4 text-14 leading-5 text-grey-500"
            >
              {roleName[membership.role]}
            </Typography>

            <div className="flex items-center border-b border-grey-100 px-2 py-4">
              <Dropdown>
                <DropdownButton className="rounded-8 hover:bg-grey-100 data-[headlessui-state*=open]:bg-grey-100">
                  <MoreVerticalIcon />
                </DropdownButton>

                <DropdownItems>
                  {false && (
                    /* FIXME: implement current team identifying */ <DropdownItem>
                      <div className="flex items-center gap-x-2">
                        <LoginSquareIcon className="size-4 text-grey-400" />
                        Switch to team
                      </div>
                    </DropdownItem>
                  )}

                  {(membership.role === Role_Enum.Owner ||
                    membership.role === Role_Enum.Admin) && (
                    <DropdownItem
                      onClick={() => setTeamForEdit(membership.team)}
                    >
                      <div className="flex items-center gap-x-2">
                        <EditIcon className="size-4 text-grey-400" />

                        <Typography variant={TYPOGRAPHY.R4}>
                          Edit team
                        </Typography>
                      </div>
                    </DropdownItem>
                  )}

                  {membership.role === Role_Enum.Owner && (
                    <DropdownItem
                      onClick={() => setTeamForTransfer(membership.team)}
                    >
                      <div className="flex items-center gap-x-2">
                        <ExchangeIcon className="size-4 text-grey-400" />

                        <Typography variant={TYPOGRAPHY.R4}>
                          Transfer ownership
                        </Typography>
                      </div>
                    </DropdownItem>
                  )}

                  {membership.role === Role_Enum.Owner && (
                    <DropdownItem
                      onClick={() => setTeamForDelete(membership.team)}
                    >
                      <div className="flex items-center gap-x-2 text-system-error-600">
                        <LogoutIcon className="size-4" />

                        <Typography variant={TYPOGRAPHY.R4}>
                          Delete team
                        </Typography>
                      </div>
                    </DropdownItem>
                  )}

                  {(membership.role === Role_Enum.Admin ||
                    membership.role === Role_Enum.Member) && (
                    <DropdownItem
                      onClick={() => setTeamForLeave(membership.team)}
                    >
                      <div className="flex items-center gap-x-2 text-system-error-600">
                        <LogoutIcon className="size-4" />
                        Leave team
                      </div>
                    </DropdownItem>
                  )}
                </DropdownItems>
              </Dropdown>
            </div>
          </div>
        ))}
      </div>

      <DeleteTeamDialog
        //team={teamForDelete}
        open={!!teamForDelete}
        onClose={() => setTeamForDelete(undefined)}
      />

      <EditTeamDialog
        //team={teamForEdit}
        open={!!teamForEdit}
        onClose={() => setTeamForEdit(undefined)}
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
