"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import {
  InviteTeamMemberDialog,
  inviteTeamMemberDialogAtom,
} from "./InviteTeamMemberDialog";
import { List } from "./List";
import { PlusIcon } from "@/components/Icons/PlusIcon";

const schema = yup.object({
  search: yup.string(),
});

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

  return (
    <div className="grid gap-y-4">
      <Typography variant={TYPOGRAPHY.H7}>Members</Typography>

      <div className="mt-4 grid w-full grid-cols-1 items-center justify-between gap-x-6 gap-y-4 max-md:contents md:grid-cols-1fr/auto">
        <Input
          register={register("search")}
          type="search"
          label=""
          addOnLeft={<MagnifierIcon className="text-grey-400" />}
          placeholder="Search member by name or email"
          className="max-w-full px-4 py-2 md:max-w-[480px]"
        />

        {isEnoughPermissions && (
          <div className="max-md:sticky max-md:bottom-0 max-md:order-3 max-md:grid max-md:justify-center max-md:py-8">
            <DecoratedButton
              type="button"
              onClick={() => setInviteTeamMemberDialogOpened(true)}
              variant="primary"
              className="min-w-[200px] py-2.5"
            >
              <PlusIcon className="size-5 md:hidden" />
              <span className="md:hidden">New member</span>
              <span className="max-md:hidden">Invite new member</span>
            </DecoratedButton>
          </div>
        )}
      </div>

      <List search={search} />

      <InviteTeamMemberDialog />
    </div>
  );
};
