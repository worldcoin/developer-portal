"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import {
  InviteTeamMemberDialog,
  inviteTeamMemberDialogAtom,
} from "./InviteTeamMemberDialog";
import { List } from "./List";

const schema = yup.object({
  search: yup.string(),
});

export const Members = () => {
  const [, setInviteTeamMemberDialogOpened] = useAtom(
    inviteTeamMemberDialogAtom,
  );

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

      <div className="mt-4 flex items-center justify-between gap-x-6">
        <Input
          register={register("search")}
          label=""
          addOnLeft={<MagnifierIcon className="text-grey-400" />}
          placeholder="Search member by name or email"
          className="max-w-[480px] px-4 py-2"
        />

        <DecoratedButton
          type="button"
          onClick={() => setInviteTeamMemberDialogOpened(true)}
          variant="primary"
          className="min-w-[200px] py-2.5"
        >
          <Typography variant={TYPOGRAPHY.M3}>Invite new member</Typography>
        </DecoratedButton>
      </div>

      <List search={search} />

      <InviteTeamMemberDialog />
    </div>
  );
};
