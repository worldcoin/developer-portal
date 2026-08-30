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
import type { MembersView } from "..";

type ListProps = {
  membersRes: ReturnType<
    typeof useQuery<FetchTeamMembersQuery, FetchTeamMembersQueryVariables>
  >;
  keyword?: string;
  view: MembersView;
};

export const List = (props: ListProps) => {
  const { membersRes, view } = props;
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
    if (view === "members") {
      return membersRes.data.members;
    }

    return membersRes.data.invites.map((invite) => ({
      id: invite.id,
      role: Role_Enum.Member,
      user: {
        id: `invite-${invite.id}`,
        name: invite.email,
        email: invite.email,
      },
    })) satisfies FetchTeamMembersQuery["members"][number][];
  }, [membersRes.data, view]);

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
      <div className="grid min-w-0 gap-3">
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
            onCancelInvite={() => cancelInvite(item)}
          />
        ))}

        {membersRes.data && items.length === 0 && (
          <div className="flex min-h-[71px] w-full items-center justify-center rounded-[10px] border border-portal-border px-4">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
              {props.keyword
                ? "No results"
                : view === "invites"
                  ? "No pending invitations"
                  : "No team members"}
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
