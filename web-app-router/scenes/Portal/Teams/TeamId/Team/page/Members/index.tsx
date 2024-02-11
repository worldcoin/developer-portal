"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { List } from "./List";
import {
  InviteTeamMemberDialog,
  inviteTeamMemberDialogAtom,
} from "./InviteTeamMemberDialog";
import { useAtom } from "jotai";

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

      <div className="flex justify-between items-center mt-4 gap-x-6">
        <Input
          register={register("search")}
          label=""
          addOnLeft={<MagnifierIcon className="text-grey-400" />}
          placeholder="Search member by name or email"
          className="px-4 py-2 max-w-[480px]"
        />

        <DecoratedButton
          type="button"
          onClick={() => setInviteTeamMemberDialogOpened(true)}
          variant="primary"
          className="py-2.5 min-w-[200px]"
        >
          <Typography variant={TYPOGRAPHY.M3}>Invite new member</Typography>
        </DecoratedButton>
      </div>

      <List search={search} />

      <InviteTeamMemberDialog />
    </div>
  );
};
