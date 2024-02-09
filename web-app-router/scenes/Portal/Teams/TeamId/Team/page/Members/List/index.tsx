"use client";

import { useParams } from "next/navigation";
import { useFetchMembershipsQuery } from "./graphql/client/fetch-members.generated";
import { useEffect, useMemo, useState } from "react";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { UserLogo } from "./UserLogo";
import { Role_Enum } from "@/graphql/graphql";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { Footer } from "@/components/Table/Footer";
import { EditUserIcon } from "@/components/Icons/EditUserIcon";
import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useFetchUserLazyQuery } from "./graphql/client/fetch-user.generated";
import { useFetchInvitesQuery } from "./graphql/client/fetch-invites.generated";
import dayjs from "dayjs";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

export const List = (props: { search?: string }) => {
  const { user } = useUser() as Auth0SessionUser;
  const { teamId } = useParams() as { teamId: string };

  const [fetchUser, { data: fetchUserResult }] = useFetchUserLazyQuery({
    context: { headers: { team_id: teamId } },
  });

  useEffect(() => {
    if (!user?.hasura.id) {
      return;
    }

    fetchUser({
      variables: {
        userId: user?.hasura.id,
        teamId,
      },
    });
  }, [fetchUser, teamId, user?.hasura.id]);

  const isEnoughPermissions = useMemo(() => {
    if (!fetchUserResult) {
      return false;
    }

    return fetchUserResult?.membership?.[0].role === Role_Enum.Owner;
  }, [fetchUserResult]);

  const { data } = useFetchMembershipsQuery({
    variables: {
      teamId: teamId,
    },

    context: { headers: { team_id: teamId } },
  });

  const { data: fetchInvitesData } = useFetchInvitesQuery({
    variables: {
      teamId: teamId,
    },
    context: { headers: { team_id: teamId } },
  });

  const memberships = useMemo(() => {
    const formatttedInvites = fetchInvitesData?.invite
      .filter((invite) => dayjs(invite.expires_at) > dayjs())
      .map((invite) => ({
        user: {
          id: `invite-${window.crypto.randomUUID()}`,
          name: invite.email,
          email: invite.email,
        },
        role: Role_Enum.Member,
      }));

    return [...(data?.membership ?? []), ...(formatttedInvites ?? [])];
  }, [data?.membership, fetchInvitesData?.invite]);

  const [totalResultsCount, setTotalResultsCount] = useState(
    memberships.length
  );

  const rowsPerPageOptions = [10, 20];
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const membersToRender = useMemo(() => {
    if (!memberships) {
      return [];
    }

    let filteredMemberships = memberships;

    if (props.search) {
      setCurrentPage(1);
      const fieldsToSearch = ["name", "email"] as const;

      filteredMemberships = filteredMemberships.filter((membership: any) => {
        return fieldsToSearch.some((field) => {
          return membership.user[field]
            ?.toLowerCase()
            .includes(props.search?.toLowerCase());
        });
      });
    }

    setTotalResultsCount(filteredMemberships.length);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedActions = filteredMemberships.slice(startIndex, endIndex);

    return paginatedActions;
  }, [currentPage, memberships, props.search, rowsPerPage]);

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_auto]">
        <div className="contents leading-4 text-12 text-grey-400">
          <Typography
            variant={TYPOGRAPHY.R5}
            className="py-3 border-b border-grey-100"
          >
            Member
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="py-3 border-b border-grey-100"
          >
            Role
          </Typography>

          <div className="py-3 border-b border-grey-100" />

          {membersToRender &&
            membersToRender.map((membership) => (
              <div key={membership.user.id} className="contents">
                <div className="flex items-center gap-x-4 px-2 py-4 border-b border-grey-100">
                  <UserLogo src={""} name={membership.user.name ?? ""} />

                  <div className="grid gap-y-0.5">
                    <Typography
                      variant={TYPOGRAPHY.R3}
                      className="text-grey-900"
                    >
                      {membership.user.name ?? ""}
                    </Typography>

                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="text-grey-500"
                    >
                      {membership.user.email ?? ""}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center py-4 leading-5 text-14 text-grey-500 border-b border-grey-100">
                  <Typography variant={TYPOGRAPHY.R4}>
                    {roleName[membership.role]}
                  </Typography>

                  {membership.user.id.startsWith("invite-") && (
                    <div className="mx-auto py-1 px-3 rounded-full bg-system-warning-100">
                      <Typography
                        variant={TYPOGRAPHY.S3}
                        className="text-system-warning-500"
                      >
                        Pending invite
                      </Typography>
                    </div>
                  )}
                </div>

                <div className="flex items-center px-2 py-4 border-b border-grey-100">
                  <Dropdown>
                    <DropdownButton className="rounded-8 hover:bg-grey-100 data-[headlessui-state*=open]:bg-grey-100">
                      <MoreVerticalIcon className="text-grey-900" />
                    </DropdownButton>

                    <DropdownItems>
                      {isEnoughPermissions && (
                        <DropdownItem>
                          <Button
                            href="#"
                            className=" grid grid-cols-auto/1fr items-center gap-x-2 hover:bg-grey-100 transition-colors"
                          >
                            <EditUserIcon />

                            <Typography variant={TYPOGRAPHY.R4}>
                              Edit role
                            </Typography>
                          </Button>
                        </DropdownItem>
                      )}

                      {isEnoughPermissions && (
                        <DropdownItem>
                          <Button
                            href="#"
                            className="text-system-error-600 grid grid-cols-auto/1fr items-center gap-x-2 hover:bg-grey-100 transition-colors"
                          >
                            <TrashIcon />

                            <Typography variant={TYPOGRAPHY.R4}>
                              Remove member
                            </Typography>
                          </Button>
                        </DropdownItem>
                      )}
                    </DropdownItems>
                  </Dropdown>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Footer
        totalResults={totalResultsCount ?? 0}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
        className="border-none"
      />
    </div>
  );
};
