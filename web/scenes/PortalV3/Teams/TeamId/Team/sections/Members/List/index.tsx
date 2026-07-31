"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useMutation, useQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { InviteTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/invite-team-members.generated";
import { EditRoleDialog, editRoleDialogAtom } from "./EditRoleDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { RemoveUserDialog, removeUserDialogAtom } from "./RemoveUserDialog";
import { DeleteInviteDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/List/graphql/client/delete-invite.generated";
import {
  FetchTeamMembersDocument,
  FetchTeamMembersQuery,
  FetchTeamMembersQueryVariables,
} from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { Item } from "./Item";

type ListProps = {
  membersRes: ReturnType<
    typeof useQuery<FetchTeamMembersQuery, FetchTeamMembersQueryVariables>
  >;
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

  const [inviteTeamMembers, { loading: resendMutationLoading }] = useMutation(
    InviteTeamMembersDocument,
  );

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

  const [deleteInvite, { loading: deleteInviteMutationLoading }] = useMutation(
    DeleteInviteDocument,
    {
      refetchQueries: [FetchTeamMembersDocument],
      awaitRefetchQueries: true,
    },
  );

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
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-y border-grey-100 bg-grey-25 px-5 py-2.5 font-gta text-12 leading-4 text-grey-400">
        <span>Member</span>
        <span>Access</span>
        <span aria-hidden="true" />
      </div>

      <div className="max-h-[229px] [scrollbar-width:thin] overflow-y-auto">
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

        {membersRes.data && items.length === 0 && props.keyword && (
          <div className="flex h-36 w-full items-center justify-center">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
              No results
            </Typography>
          </div>
        )}
      </div>

      <RemoveUserDialog name={userToRemove?.name ?? ""} id={userToRemove?.id} />

      <EditRoleDialog membership={userToEditRole} />

      <PermissionsDialog />
    </>
  );
};
