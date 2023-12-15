import { memo, useState } from "react";
import { Team, TeamMember } from "../../hooks/useTeam";
import { Icon } from "src/components/Icon";
import { RemoveMemberDialog } from "../RemoveMemberDialog";

export const Member = memo(function Member(props: {
  team: Team;
  member: TeamMember;
  index: number;
}) {
  const { team, member, index } = props;
  const [memberForRemove, setMemberForRemove] = useState<TeamMember>();

  return (
    <>
      <div className="flex items-center gap-x-3 p-4 border border-gray-200 rounded-xl shadow-card-new">
        <div className="grid place-items-center w-10 h-10 bg-success-light rounded-full">
          <Icon name="user-solid" className="w-4 h-4 bg-success" />
        </div>

        <div className="grow">
          <div className="leading-5 font-medium text-14 text-gray-900">
            {member.name}
          </div>

          <div className="leading-4 text-12 text-gray-700">{member.email}</div>
        </div>

        {index > 1 && (
          <button
            className="block h-4 text-gray-400"
            onClick={() => setMemberForRemove(member)}
          >
            <Icon name="delete" className="w-4 h-4" />
          </button>
        )}
      </div>

      <RemoveMemberDialog
        team={team}
        memberForRemove={memberForRemove}
        onClose={() => setMemberForRemove(undefined)}
      />
    </>
  );
});
