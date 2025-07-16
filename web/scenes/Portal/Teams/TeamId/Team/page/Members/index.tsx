"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Input } from "@/components/Input";
import { Section } from "@/components/Section";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import * as yup from "yup";
import { useFetchTeamMembersQuery } from "./graphql/client/fetch-team-members.generated";
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

  const membersRes = useFetchTeamMembersQuery({
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

  return (
    <Section>
      <Section.Header>
        <Section.Header.Title>Members</Section.Header.Title>

        <Section.Header.Search>
          <Input
            register={register("search")}
            type="search"
            label=""
            addOnLeft={<MagnifierIcon className="text-grey-400" />}
            placeholder="Search member by name or email"
            className="max-w-full px-4 py-2 md:max-w-[480px]"
          />
        </Section.Header.Search>

        <Section.Header.Button>
          {membersRes.loading ? (
            <Skeleton className="h-12 w-[12rem] rounded-xl" />
          ) : (
            <DecoratedButton
              type="button"
              onClick={() => setInviteTeamMemberDialogOpened(true)}
              variant="primary"
              className="min-w-[12rem] py-2.5"
              disabled={membersRes.data && !isEnoughPermissions}
            >
              <PlusIcon className="size-5 md:hidden" />
              <span className="md:hidden">New member</span>
              <span className="max-md:hidden">Invite new member</span>
            </DecoratedButton>
          )}
        </Section.Header.Button>
      </Section.Header>

      <List membersRes={membersRes} keyword={search} />

      <InviteTeamMemberDialog />
    </Section>
  );
};
