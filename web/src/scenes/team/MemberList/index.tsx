import { useToggle } from "@/hooks/useToggle";
import { Icon } from "@/components/Icon";
import { memo, useMemo, useState } from "react";
import { Controls } from "./Controls";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { useDebouncedCallback } from "use-debounce";
import { TeamMemberModel } from "@/lib/models";

export interface MemberListProps {
  members: TeamMemberModel[];
}

export const MemberList = memo(function MemberList(props: MemberListProps) {
  const { members } = props;
  const inviteDialog = useToggle();

  const [memberForRemove, setMemberForRemove] = useState<TeamMemberModel>();

  const [keyword, setKeyword] = useState("");

  const handleKeywordChange = useDebouncedCallback(
    (value) => setKeyword(value),
    500
  );

  const filteredMembers = useMemo(() => {
    if (!keyword) return members;
    return members.filter((member) => {
      return member.name.includes(keyword) || member.email.includes(keyword);
    });
  }, [keyword, members]);

  return (
    <div>
      <InviteMembersDialog
        open={inviteDialog.isOn}
        onClose={inviteDialog.toggleOff}
      />

      <RemoveMemberDialog
        memberForRemove={memberForRemove}
        onClose={() => setMemberForRemove(undefined)}
      />

      <div className="grid gap-y-4">
        <Controls
          onInviteClick={inviteDialog.toggleOn}
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
        />

        <div className="space-x-2 text-neutral text-14 mt-4">
          <span>Member</span>

          <span className="bg-ebecef py-1 px-1.5 rounded-[4px]">
            {members.length}
          </span>
        </div>

        <div className="grid gap-y-4">
          {filteredMembers.map((member, key) => (
            <div
              key={key}
              className="flex items-center bg-ffffff rounded-xl shadow-lg p-4 gap-3"
            >
              <div className="relative w-10 h-10 grid place-items-center bg-success-light rounded-full">
                <Icon name="user-solid" className="w-4 h-4 bg-success" />

                {/* FIXME: add verified flag to hasura */}
                {/*{member.verified && (*/}
                {/*  <Icon*/}
                {/*    name="badge-verification"*/}
                {/*    className="absolute w-5 h-5 -bottom-1 -right-1"*/}
                {/*    noMask*/}
                {/*  />*/}
                {/*)}*/}
              </div>

              <div className="flex-1 space-y-1">
                <h5>{member.name}</h5>
                <p className="text-12">{member.email}</p>
              </div>

              <button
                className="text-danger hover:opacity-75 transition-opacity"
                onClick={() => setMemberForRemove(member)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
