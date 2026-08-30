"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { FetchTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
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

export type MembersView = "members" | "invites";

export const Members = (props: { teamId: string }) => {
  const { teamId } = props;
  const [view, setView] = useState<MembersView>("members");
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

  return (
    <div className="w-full px-4 pt-5 pb-28 sm:px-6">
      <div className="w-full max-w-[800px] min-w-0">
        <header className="relative h-8">
          <h1 className="absolute top-1/2 left-0 -translate-y-1/2 font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
            Members
          </h1>

          <InkButton
            type="button"
            onClick={() => setInviteTeamMemberDialogOpened(true)}
            disabled={
              membersRes.loading ||
              Boolean(membersRes.data && !isEnoughPermissions)
            }
            className="absolute top-0 right-0"
          >
            Invite member
          </InkButton>
        </header>

        <div
          className="mt-4 flex h-[26px] gap-5 border-b border-portal-border"
          role="tablist"
          aria-label="Members view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "members"}
            onClick={() => setView("members")}
            className={clsx(
              "relative h-[26px] border-b pb-[7px] font-world text-15 leading-[1.2] font-[450] outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
              view === "members"
                ? "border-portal-ink text-portal-ink"
                : "border-transparent text-[#7d7d7d]",
            )}
          >
            Team members
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "invites"}
            onClick={() => setView("invites")}
            className={clsx(
              "relative h-[26px] border-b pb-[7px] font-world text-15 leading-[1.2] font-[450] outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
              view === "invites"
                ? "border-portal-ink text-portal-ink"
                : "border-transparent text-[#7d7d7d]",
            )}
          >
            Pending invitations
          </button>
        </div>

        <label className="mt-4 flex h-10 w-full items-center gap-2 overflow-hidden rounded-[10px] border border-portal-border bg-white px-3">
          <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/icons/member-search.svg"
              width={14}
              height={14}
              alt=""
              aria-hidden
              className="h-[13.0885px] w-[13.1335px]"
            />
          </span>
          <input
            {...register("search")}
            type="search"
            aria-label="Search by name or email"
            placeholder="Search by name or email"
            className="h-full min-w-0 flex-1 appearance-none bg-transparent p-0 font-world text-13 leading-[1.3] font-[350] text-portal-ink outline-hidden placeholder:text-[#808080] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </label>

        <div className="mt-6">
          <List membersRes={membersRes} keyword={search} view={view} />
        </div>
      </div>

      <InviteTeamMemberDialog />
    </div>
  );
};
