"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useInviteTeamMembersMutation } from "../graphql/client/invite-team-members.generated";
import { EditRoleDialog, editRoleDialogAtom } from "./EditRoleDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { RemoveUserDialog, removeUserDialogAtom } from "./RemoveUserDialog";
import { useDeleteInviteMutation } from "./graphql/client/delete-invite.generated";
import {
  FetchTeamMembersDocument,
  FetchTeamMembersQuery,
  useFetchTeamMembersQuery,
} from "../graphql/client/fetch-team-members.generated";
import { Item } from "./Item";

type ListProps = {
  membersRes: ReturnType<typeof useFetchTeamMembersQuery>;
  keyword?: string;
};

export const List = (props: ListProps) => {
  const { membersRes } = props;
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { teamId } = useParams() as { teamId: string };
  const [, setIsRemoveDialogOpened] = useAtom(removeUserDialogAtom);
  const [, setIsEditRoleDialogOpened] = useAtom(editRoleDialogAtom);

  const [userToRemove, setUserToRemove] = useState<
    FetchTeamMembersQuery["members"][number]["user"] | null
  >(null);

  const [userToEditRole, setUserToEditRole] = useState<
    FetchTeamMembersQuery["members"][number] | null
  >(null);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]);
  }, [auth0User, teamId]);

  const items = useMemo(() => {
    if (!membersRes.data) {
      return [];
    }
    return [
      ...membersRes.data.members,
      ...membersRes.data.invites.map((invite) => ({
        id: invite.id,
        role: Role_Enum.Member,
        user: {
          id: `invite-${window.crypto.randomUUID()}`,
          name: invite.email,
          email: invite.email,
        },
      })),
    ] satisfies FetchTeamMembersQuery["members"][number][];
  }, [membersRes]);

  const membersToRenderHasInvitedMember = useMemo(() => {
    for (const member of items) {
      if (member.id.startsWith("inv_")) {
        return true;
      }
    }
    return false;
  }, [items]);

  const onEditUser = useCallback(
    (membership: FetchTeamMembersQuery["members"][number]) => {
      setUserToEditRole(membership);
      setIsEditRoleDialogOpened(true);
    },
    [setIsEditRoleDialogOpened],
  );

  const onRemoveUser = useCallback(
    (membership: FetchTeamMembersQuery["members"][number]) => {
      setUserToRemove(membership.user);
      setIsRemoveDialogOpened(true);
    },
    [setIsRemoveDialogOpened],
  );

  const [inviteTeamMembers, { loading: resendMutationLoading }] =
    useInviteTeamMembersMutation();

  const resendInvite = useCallback(
    async (membership: FetchTeamMembersQuery["members"][number]) => {
      if (!membership.user.email || resendMutationLoading) {
        return;
      }

      try {
        await inviteTeamMembers({
          variables: { emails: [membership.user.email], team_id: teamId },
          refetchQueries: [FetchTeamMembersDocument],
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
      refetchQueries: [FetchTeamMembersDocument],
      awaitRefetchQueries: true,
    });

  const cancelInvite = useCallback(
    async (membership: FetchTeamMembersQuery["members"][number]) => {
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
    (membership: FetchTeamMembersQuery["members"][number]) => {
      return membership.user?.id === auth0User?.hasura.id;
    },
    [auth0User?.hasura.id],
  );

  return (
    <div className="order-2">
      <div className="grid md:grid-cols-[max-content_auto_auto_auto_max-content] md:items-center">
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

          {membersRes.loading &&
            Array.from({ length: 3 }).map((_, i) => <Item key={i} />)}

          {items.map((item) => (
            <Item
              key={item.id}
              item={item}
              isCurrent={isCurrentMember(item)}
              isEnoughPermissions={isEnoughPermissions}
              onEdit={() => onEditUser(item)}
              onRemove={() => onRemoveUser(item)}
              onResendInvite={() => resendInvite(item)}
              onCancelInvite={() => cancelInvite(item)}
            />
          ))}
        </div>
      </div>

      {membersRes.data && items.length === 0 && props.keyword && (
        <div className="flex h-[240px] w-full items-center justify-center rounded-2xl border border-grey-200">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
            No results
          </Typography>
        </div>
      )}

      <RemoveUserDialog name={userToRemove?.name ?? ""} id={userToRemove?.id} />

      <EditRoleDialog membership={userToEditRole} />

      <PermissionsDialog />
    </div>
  );
};
