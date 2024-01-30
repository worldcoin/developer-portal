import { useToggle } from "@/hooks/useToggle";
import { memo, useMemo, useState } from "react";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { TeamMember } from "@/scenes/team/hooks/useTeam";
import { Button } from "src/components/Button";
import { Member } from "./Member";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useRouter } from "next/router";
import { Role_Enum } from "@/graphql/graphql";

export interface MemberListProps {
  members: TeamMember[];
}

export const MemberList = memo(function MemberList(props: MemberListProps) {
  const members = useMemo(() => props.members, [props.members]);
  const { user } = useUser() as Auth0SessionUser;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const inviteDialog = useToggle();

  const [keyword, setKeyword] = useState("");

  const filteredMembers = useMemo(() => {
    if (!keyword) return members;

    return members.filter((member) => {
      return (
        member.user.name.includes(keyword) ||
        member.user.email?.includes(keyword)
      );
    });
  }, [keyword, members]);

  const currentUserRole = useMemo(() => {
    return user?.hasura.memberships.find((i) => i.team?.id === team_id)?.role;
  }, [team_id, user?.hasura.memberships]);

  return (
    <div>
      <InviteMembersDialog
        open={inviteDialog.isOn}
        onClose={inviteDialog.toggleOff}
      />

      <div className="grid gap-y-4">
        <div className="flex justify-between text-14 mt-4">
          <div className="space-x-2">
            <span className="font-medium">Team members</span>

            <span className="bg-ebecef py-1 px-1.5 rounded-[4px]">
              {members.length}
            </span>
          </div>

          {currentUserRole === Role_Enum.Owner && (
            <Button
              className="py-3.5 px-8 uppercase"
              onClick={inviteDialog.toggleOn}
            >
              Invite new members
            </Button>
          )}
        </div>

        <div className="grid gap-y-4">
          {filteredMembers.map((member, key) => (
            <Member key={key} member={member} length={members.length} />
          ))}
        </div>
      </div>
    </div>
  );
});
