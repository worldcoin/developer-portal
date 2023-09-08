import { useToggle } from "@/hooks/useToggle";
import { memo, useMemo, useState } from "react";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { TeamMember } from "@/scenes/team/hooks/useTeam";
import { Button } from "src/components/Button";
import { Member } from "./Member";

export interface MemberListProps {
  members: TeamMember[];
}

export const MemberList = memo(function MemberList(props: MemberListProps) {
  const { members } = props;
  const inviteDialog = useToggle();

  const [keyword, setKeyword] = useState("");

  const filteredMembers = useMemo(() => {
    if (!keyword) return members;
    return members.filter((member) => {
      return member.name.includes(keyword) || member.email?.includes(keyword);
    });
  }, [keyword, members]);

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

          <Button
            className="py-3.5 px-8 uppercase"
            onClick={inviteDialog.toggleOn}
          >
            Invite new members
          </Button>
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
