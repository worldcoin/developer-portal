"use client";

import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Input } from "@/components/Input";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import * as yup from "yup";
import { FetchTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { SettingsPanel } from "@/scenes/PortalV3/Teams/TeamId/Team/common/SettingsPanel";
import {
  InviteTeamMemberDialog,
  inviteTeamMemberDialogAtom,
} from "./InviteTeamMemberDialog";
import { List } from "./List";

const schema = yup
  .object({
    search: yup.string(),
  })
  .noUnknown();

export const Members = (props: { teamId: string }) => {
  const { teamId } = props;
  const [, setInviteTeamMemberDialogOpened] = useAtom(
    inviteTeamMemberDialogAtom,
  );
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const { register, control } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const search = useWatch({
    control,
    name: "search",
  });

  const membersRes = useQuery(FetchTeamMembersDocument, {
    variables: {
      teamId,
      invitesCondition: !search ? {} : [{ email: { _ilike: `%${search}%` } }],
      membersCondition: !search
        ? {}
        : [
            { user: { name: { _ilike: `%${search}%` } } },
            { user: { email: { _ilike: `%${search}%` } } },
          ],
    },
  });

  // NOTE: refetch me query to update session in case user role was changed
  useEffect(() => {
    if (!membersRes.client || !membersRes.data) {
      return;
    }

    membersRes.client.refetchQueries({ include: [FetchMeDocument] });
  }, [membersRes.client, membersRes.data]);

  const memberCount = membersRes.data?.members.length ?? 0;
  const pendingInviteCount = membersRes.data?.invites.length ?? 0;

  return (
    <SettingsPanel>
      <SettingsPanel.Header className="pb-4">
        <SettingsPanel.Title>Members</SettingsPanel.Title>

        <div className="mt-4">
          <Input
            register={register("search")}
            type="search"
            label=""
            addOnLeft={<MagnifierIcon className="text-grey-400" />}
            placeholder="Search member by name or email"
            className="w-full px-4 py-2"
          />
        </div>
      </SettingsPanel.Header>

      <List membersRes={membersRes} keyword={search} />

      <SettingsPanel.Footer>
        {membersRes.loading ? (
          <Skeleton width={72} />
        ) : (
          <span className="font-gta text-12 text-grey-400">
            {memberCount} {memberCount === 1 ? "member" : "members"}
            {pendingInviteCount > 0 ? ` · ${pendingInviteCount} pending` : null}
          </span>
        )}

        <button
          type="button"
          onClick={() => setInviteTeamMemberDialogOpened(true)}
          disabled={
            membersRes.loading ||
            Boolean(membersRes.data && !isEnoughPermissions)
          }
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-8 bg-portal-ink px-3 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-500"
        >
          <PlusIcon className="size-4" />
          Invite new member
        </button>
      </SettingsPanel.Footer>

      <InviteTeamMemberDialog />
    </SettingsPanel>
  );
};
