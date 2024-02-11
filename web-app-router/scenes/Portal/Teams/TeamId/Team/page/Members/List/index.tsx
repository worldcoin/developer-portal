"use client";

import { useParams } from "next/navigation";
import {
  FetchMembershipsQuery,
  useFetchMembershipsQuery,
} from "./graphql/client/fetch-members.generated";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useFetchUserLazyQuery } from "./graphql/client/fetch-user.generated";
import {
  FetchInvitesDocument,
  useFetchInvitesQuery,
} from "./graphql/client/fetch-invites.generated";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import { useAtom } from "jotai";
import { RemoveUserDialog, removeUserDialogAtom } from "./RemoveUserDialog";
import { EditRoleDialog, editRoleDialogAtom } from "./EditRoleDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { useInviteTeamMembersMutation } from "../graphql/client/invite-team-members.generated";
import { toast } from "react-toastify";
import { SendIcon } from "@/components/Icons/SendIcon";
import { useDeleteInviteMutation } from "./graphql/client/delete-invite.generated";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

export const List = (props: { search?: string }) => {
  const { user } = useUser() as Auth0SessionUser;
  const { teamId } = useParams() as { teamId: string };
  const [, setIsRemoveDialogOpened] = useAtom(removeUserDialogAtom);
  const [, setIsEditRoleDialogOpened] = useAtom(editRoleDialogAtom);

  const [userToRemove, setUserToRemove] = useState<
    FetchMembershipsQuery["membership"][number]["user"] | null
  >(null);

  const [userToEditRole, setUserToEditRole] = useState<
    FetchMembershipsQuery["membership"][number] | null
  >(null);

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

  // TODO: Use checkUserPermissions helper instead
  const isEnoughPermissions = useMemo(() => {
    if (!fetchUserResult) {
      return false;
    }

    return fetchUserResult?.membership?.[0]?.role === Role_Enum.Owner;
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
      .map(
        (invite) =>
          ({
            id: invite.id,
            role: Role_Enum.Member,

            user: {
              id: `invite-${window.crypto.randomUUID()}`,
              name: invite.email,
              email: invite.email,
            },
          }) as FetchMembershipsQuery["membership"][number],
      );

    return [...(data?.membership ?? []), ...(formatttedInvites ?? [])];
  }, [data?.membership, fetchInvitesData?.invite]);

  const [totalResultsCount, setTotalResultsCount] = useState(
    memberships.length,
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

  const onEditUser = useCallback(
    (membership: (typeof membersToRender)[number]) => {
      setUserToEditRole(membership);
      setIsEditRoleDialogOpened(true);
    },
    [setIsEditRoleDialogOpened],
  );

  const onRemoveUser = useCallback(
    (membership: (typeof membersToRender)[number]) => {
      setUserToRemove(membership.user);
      setIsRemoveDialogOpened(true);
    },
    [setIsRemoveDialogOpened],
  );

  const [inviteTeamMembers, { loading: resendMutationLoading }] =
    useInviteTeamMembersMutation({
      context: { headers: { team_id: teamId } },
    });

  const resendInvite = useCallback(
    async (membership: (typeof membersToRender)[number]) => {
      if (!membership.user.email || resendMutationLoading) {
        return;
      }

      try {
        await inviteTeamMembers({
          variables: { emails: [membership.user.email] },
          refetchQueries: [FetchInvitesDocument],
        });

        toast.success(`New invite is sent to ${membership.user.email}`);
      } catch (error) {
        toast.error("Error inviting team members");
      }
    },
    [inviteTeamMembers, resendMutationLoading],
  );

  const [deleteInvite, { loading: deleteInviteMutationLoading }] =
    useDeleteInviteMutation({
      context: { headers: { team_id: teamId } },
      refetchQueries: [FetchInvitesDocument],
      awaitRefetchQueries: true,
    });

  const cancelInvite = useCallback(
    async (membership: (typeof membersToRender)[number]) => {
      if (
        !isEnoughPermissions ||
        !membership.id.startsWith("inv_") ||
        deleteInviteMutationLoading
      ) {
        return;
      }

      try {
        await deleteInvite({
          variables: {
            inviteId: membership.id,
          },
        });

        toast.success("Invite canceled successfully");
      } catch (error) {
        return toast.error("Error canceling invite");
      }
    },
    [deleteInvite, deleteInviteMutationLoading, isEnoughPermissions],
  );

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_auto]">
        {membersToRender.length > 0 && (
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

            {membersToRender.map((membership) => {
              const isInviteRow = membership.id.startsWith("inv_");

              return (
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

                    {isInviteRow && (
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
                        {isEnoughPermissions && !isInviteRow && (
                          <DropdownItem
                            as="button"
                            onClick={() => onEditUser(membership)}
                            className=" grid grid-cols-auto/1fr items-center gap-x-2 hover:bg-grey-100 transition-colors w-full"
                          >
                            <EditUserIcon className="text-grey-400" />

                            <Typography
                              variant={TYPOGRAPHY.R4}
                              className="text-start"
                            >
                              Edit role
                            </Typography>
                          </DropdownItem>
                        )}

                        {isEnoughPermissions && isInviteRow && (
                          <DropdownItem
                            as="button"
                            onClick={() => resendInvite(membership)}
                            className="grid grid-cols-auto/1fr items-center gap-x-2 hover:bg-grey-100 transition-colors w-full"
                          >
                            <SendIcon className="text-grey-400" />

                            <Typography variant={TYPOGRAPHY.R4}>
                              Re-send invite
                            </Typography>
                          </DropdownItem>
                        )}

                        {isEnoughPermissions && (
                          <DropdownItem
                            as="button"
                            onClick={() =>
                              isInviteRow
                                ? cancelInvite(membership)
                                : onRemoveUser(membership)
                            }
                            className="text-system-error-600 grid grid-cols-auto/1fr items-center gap-x-2 hover:bg-grey-100 transition-colors w-full"
                          >
                            <TrashIcon />

                            <Typography variant={TYPOGRAPHY.R4}>
                              {isInviteRow ? "Cancel invite" : "Remove member"}
                            </Typography>
                          </DropdownItem>
                        )}
                      </DropdownItems>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {membersToRender.length === 0 && !props.search && (
        <div className="grid w-full gap-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`skeleton-list-item-${i}`} height={80} />
          ))}
        </div>
      )}

      {membersToRender.length === 0 && props.search && (
        <div className="w-full h-[240px] border border-grey-200 rounded-2xl flex justify-center items-center">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
            No results
          </Typography>
        </div>
      )}

      <Footer
        totalResults={totalResultsCount ?? 0}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
        className="border-none"
      />

      <RemoveUserDialog name={userToRemove?.name ?? ""} id={userToRemove?.id} />
      <EditRoleDialog membership={userToEditRole} />
      <PermissionsDialog />
    </div>
  );
};
