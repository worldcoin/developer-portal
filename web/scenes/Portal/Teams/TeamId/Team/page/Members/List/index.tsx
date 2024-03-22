"use client";

import { Dropdown } from "@/components/Dropdown";
import { EditUserIcon } from "@/components/Icons/EditUserIcon";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { SendIcon } from "@/components/Icons/SendIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Footer } from "@/components/Table/Footer";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, getNullifierName } from "@/lib/utils";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useInviteTeamMembersMutation } from "../graphql/client/invite-team-members.generated";
import { EditRoleDialog, editRoleDialogAtom } from "./EditRoleDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { RemoveUserDialog, removeUserDialogAtom } from "./RemoveUserDialog";
import { UserLogo } from "./UserLogo";
import { useDeleteInviteMutation } from "./graphql/client/delete-invite.generated";
import {
  FetchInvitesDocument,
  useFetchInvitesQuery,
} from "./graphql/client/fetch-invites.generated";
import {
  FetchTeamMembersQuery,
  useFetchTeamMembersQuery,
} from "./graphql/client/fetch-team-members.generated";

const roleName: Record<Role_Enum, string> = {
  [Role_Enum.Admin]: "Admin",
  [Role_Enum.Member]: "Member",
  [Role_Enum.Owner]: "Owner",
};

export const List = (props: { search?: string }) => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { teamId } = useParams() as { teamId: string };
  const [, setIsRemoveDialogOpened] = useAtom(removeUserDialogAtom);
  const [, setIsEditRoleDialogOpened] = useAtom(editRoleDialogAtom);

  const [userToRemove, setUserToRemove] = useState<
    FetchTeamMembersQuery["membership"][number]["user"] | null
  >(null);

  const [userToEditRole, setUserToEditRole] = useState<
    FetchTeamMembersQuery["membership"][number] | null
  >(null);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]);
  }, [auth0User, teamId]);

  const { data, client } = useFetchTeamMembersQuery({
    variables: {
      teamId: teamId,
    },
  });

  const { data: fetchInvitesData } = useFetchInvitesQuery({
    variables: {
      teamId: teamId,
    },
  });

  // NOTE: refetch me query to update session in case user role was changed
  useEffect(() => {
    if (!data || !client) {
      return;
    }

    client.refetchQueries({ include: [FetchMeDocument] });
  }, [client, data]);

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
          }) as FetchTeamMembersQuery["membership"][number],
      );

    return [...(data?.membership ?? []), ...(formatttedInvites ?? [])];
  }, [data?.membership, fetchInvitesData?.invite]);

  //const [totalResultsCount, setTotalResultsCount] = useState(
  //  memberships.length,
  //);

  //const rowsPerPageOptions = [10, 20];
  //const [currentPage, setCurrentPage] = useState(1);
  //const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  //const handlePageChange = (newPage: number) => {
  //  setCurrentPage(newPage);
  //};

  //const handleRowsPerPageChange = (newRowsPerPage: number) => {
  //  setRowsPerPage(newRowsPerPage);
  //  setCurrentPage(1); // Reset to first page when rows per page changes
  //};

  const membersToRender = useMemo(() => {
    if (!memberships) {
      return [];
    }

    let filteredMemberships = memberships;

    if (props.search) {
      //setCurrentPage(1);
      const fieldsToSearch = ["name", "email"] as const;

      filteredMemberships = filteredMemberships.filter((membership: any) => {
        return fieldsToSearch.some((field) => {
          return membership.user[field]
            ?.toLowerCase()
            .includes(props.search?.toLowerCase());
        });
      });
    }

    //setTotalResultsCount(filteredMemberships.length);
    //const startIndex = (currentPage - 1) * rowsPerPage;
    //const endIndex = startIndex + rowsPerPage;
    //const paginatedActions = filteredMemberships.slice(startIndex, endIndex);
    //return paginatedActions;
    return filteredMemberships;
  }, [memberships, props.search]);

  const membersToRenderHasInvitedMember = useMemo(() => {
    if (!membersToRender) {
      return false;
    }
    for (const member of membersToRender) {
      if (member.id.startsWith("inv_")) {
        return true;
      }
    }
  }, [membersToRender]);

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
    useInviteTeamMembersMutation();

  const resendInvite = useCallback(
    async (membership: (typeof membersToRender)[number]) => {
      if (!membership.user.email || resendMutationLoading) {
        return;
      }

      try {
        await inviteTeamMembers({
          variables: { emails: [membership.user.email], team_id: teamId },
          refetchQueries: [FetchInvitesDocument],
        });

        toast.success(`New invite is sent to ${membership.user.email}`);
      } catch (error) {
        toast.error("Error inviting team members");
      }
    },
    [inviteTeamMembers, resendMutationLoading, teamId],
  );

  const [deleteInvite, { loading: deleteInviteMutationLoading }] =
    useDeleteInviteMutation({
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

  const isCurrentMember = useCallback(
    (membership: (typeof membersToRender)[number]) => {
      return membership.user?.id === auth0User?.hasura.id;
    },
    [auth0User?.hasura.id],
  );

  return (
    <div className="order-2">
      <div className="grid md:grid-cols-[max-content_auto_auto_auto_max-content] md:items-center">
        {membersToRender.length > 0 && (
          <div className="contents text-12 leading-4 text-grey-400">
            <div className="hidden md:contents">
              <Typography variant={TYPOGRAPHY.R5} className="col-span-2 py-3">
                Member
              </Typography>

              <Typography variant={TYPOGRAPHY.R5} className="col-span-3 py-3">
                Role
              </Typography>
            </div>

            <div className="col-span-full border-b border-grey-100 max-md:hidden" />

            {membersToRenderHasInvitedMember && (
              <div className="mt-8 max-md:order-1 max-md:col-span-full max-md:mb-1 md:hidden">
                Invited
              </div>
            )}

            <div className="mt-8 max-md:order-2 max-md:col-span-full max-md:mb-1 md:hidden">
              Active
            </div>

            {membersToRender.map((membership) => {
              const isInviteRow = membership.id.startsWith("inv_");

              const name =
                membership?.user?.name ||
                membership?.user?.email ||
                getNullifierName(membership?.user?.world_id_nullifier) ||
                "Anonymous User";

              return (
                <div
                  key={membership.user?.id}
                  className={clsx(
                    "max-md:mt-2 max-md:grid max-md:grid-cols-[max-content_auto_max-content] max-md:items-center max-md:rounded-2xl max-md:border max-md:border-grey-100 md:contents",
                    {
                      "max-md:order-1": isInviteRow,
                      "max-md:order-2": !isInviteRow,
                    },
                  )}
                >
                  <div className="p-4 md:pl-2">
                    <UserLogo src={""} name={name} />
                  </div>

                  <div className="grid gap-y-0.5">
                    <Typography
                      variant={TYPOGRAPHY.R3}
                      className="max-w-full truncate text-grey-900"
                    >
                      {name}
                    </Typography>

                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="inline-grid grid-cols-[auto_1fr]  text-grey-500"
                    >
                      <div className="md:hidden">
                        {roleName[membership.role]}&nbsp;•&nbsp;
                      </div>

                      <div className="truncate">
                        {membership.user?.email ?? ""}
                      </div>
                    </Typography>
                  </div>

                  <div className="flex pr-4 text-grey-500 max-md:hidden">
                    <Typography variant={TYPOGRAPHY.R4}>
                      {roleName[membership.role]}
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
                    <Dropdown>
                      <Dropdown.Button
                        disabled={
                          !isEnoughPermissions || isCurrentMember(membership)
                        }
                        className={clsx("rounded-8 hover:bg-grey-100", {
                          "pointer-events-none invisible":
                            !isEnoughPermissions || isCurrentMember(membership),
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
                            <button onClick={() => onEditUser(membership)}>
                              <Dropdown.ListItemIcon asChild>
                                <EditUserIcon />
                              </Dropdown.ListItemIcon>

                              <Dropdown.ListItemText>
                                Edit role
                              </Dropdown.ListItemText>
                            </button>
                          </Dropdown.ListItem>
                        )}

                        {isEnoughPermissions && isInviteRow && (
                          <Dropdown.ListItem asChild>
                            <button onClick={() => resendInvite(membership)}>
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
                          <Dropdown.ListItem
                            className="text-system-error-600"
                            asChild
                          >
                            <button
                              onClick={() =>
                                isInviteRow
                                  ? cancelInvite(membership)
                                  : onRemoveUser(membership)
                              }
                            >
                              <Dropdown.ListItemIcon
                                className="text-system-error-600"
                                asChild
                              >
                                <TrashIcon />
                              </Dropdown.ListItemIcon>

                              <Dropdown.ListItemText>
                                {isInviteRow
                                  ? "Cancel invite"
                                  : "Remove member"}
                              </Dropdown.ListItemText>
                            </button>
                          </Dropdown.ListItem>
                        )}
                      </Dropdown.List>
                    </Dropdown>
                  </div>

                  <hr className="col-span-full border-grey-100 max-md:hidden" />
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
        <div className="flex h-[240px] w-full items-center justify-center rounded-2xl border border-grey-200">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
            No results
          </Typography>
        </div>
      )}

      {/*<div className="max-md:hidden">*/}
      {/*  <Footer*/}
      {/*    totalResults={totalResultsCount ?? 0}*/}
      {/*    currentPage={currentPage}*/}
      {/*    rowsPerPage={rowsPerPage}*/}
      {/*    rowsPerPageOptions={rowsPerPageOptions}*/}
      {/*    handlePageChange={handlePageChange}*/}
      {/*    handleRowsPerPageChange={handleRowsPerPageChange}*/}
      {/*    className="border-none"*/}
      {/*  />*/}
      {/*</div>*/}

      <RemoveUserDialog name={userToRemove?.name ?? ""} id={userToRemove?.id} />
      <EditRoleDialog membership={userToEditRole} />
      <PermissionsDialog />
    </div>
  );
};
