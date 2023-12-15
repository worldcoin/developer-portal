import { useToggle } from "@/hooks/useToggle";
import { memo, useState } from "react";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { Team, TeamMember } from "@/scenes/team/hooks/useTeam";
import { Icon } from "@/components/Icon";
import { Member } from "@/scenes/team/MemberList/Member";

export interface MemberListProps {
  team: Team;
  members: TeamMember[];
}

export const MemberList = memo(function MemberList(props: MemberListProps) {
  const { team, members } = props;
  const inviteDialog = useToggle();

  return (
    <>
      <div className="flex items-center gap-x-2 mt-12">
        <div className="font-medium">Members</div>

        <div className="flex items-center h-5 px-1 leading-4 text-12 text-gray-400 border border-gray-300 rounded">
          {members?.length ?? 0}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {members?.map((member, index) => (
          <Member key={index} team={team} member={member} index={index} />
        ))}

        <button
          className="flex items-center gap-x-3 px-4 py-6 text-gray-900 border border-dashed border-gray-300 rounded-xl"
          onClick={inviteDialog.toggleOn}
        >
          <Icon name="add" className="w-4 h-4" />

          <div className="leading-6 font-medium text-14">Invite member</div>
        </button>
      </div>

      <InviteMembersDialog
        open={inviteDialog.isOn}
        onClose={inviteDialog.toggleOff}
      />
    </>
  );
});
