"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Input } from "@/components/Input";
import { RestrictedAction } from "@/components/RestrictedAction";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { Section } from "@/components/Section";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import * as yup from "yup";
import { useFetchTeamMembersQuery } from "./graphql/client/fetch-team-members.generated";
import {
  InviteTeamMemberDialog,
  inviteTeamMemberDialogAtom,
} from "./InviteTeamMemberDialog";
import { List } from "./List";
import { permissionsDialogAtom } from "./List/PermissionsDialog";

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
  const [, setPermissionsDialogOpened] = useAtom(permissionsDialogAtom);
  const invitePerm = useTeamPermission(teamId, "invite_member");

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

        <Section.Header.Search className="md:col-span-2">
          <Input
            register={register("search")}
            type="search"
            label=""
            addOnLeft={<MagnifierIcon className="text-grey-400" />}
            placeholder="Search member by name or email"
            className="w-full px-4 py-2"
          />
        </Section.Header.Search>

        <Section.Header.Button className="md:row-start-1">
          {membersRes.loading ? (
            <Skeleton className="h-12 w-[12rem] rounded-xl" />
          ) : (
            <div className="flex flex-col gap-2 md:flex-row">
              <DecoratedButton
                type="button"
                variant="secondary"
                className="min-w-[10rem] py-2.5"
                onClick={() => setPermissionsDialogOpened(true)}
              >
                View permissions
              </DecoratedButton>

              <RestrictedAction restriction={invitePerm}>
                {({ disabled }) => (
                  <DecoratedButton
                    type="button"
                    onClick={() => setInviteTeamMemberDialogOpened(true)}
                    variant="primary"
                    className="min-w-[12rem] py-2.5"
                    disabled={disabled}
                  >
                    <PlusIcon className="size-5 md:hidden" />
                    <span className="md:hidden">New member</span>
                    <span className="max-md:hidden">Invite new member</span>
                  </DecoratedButton>
                )}
              </RestrictedAction>
            </div>
          )}
        </Section.Header.Button>
      </Section.Header>

      <List membersRes={membersRes} keyword={search} />

      <InviteTeamMemberDialog />
    </Section>
  );
};
