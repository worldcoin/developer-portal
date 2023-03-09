import { useToggle } from "@/hooks/useToggle";
import { Icon } from "@/components/Icon";
import { memo, useCallback, useEffect } from "react";
import { TeamMember, useTeamStore } from "../../../stores/teamStore";

import { Controls } from "./Controls";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { useDebounce } from "use-debounce";

export const MemberList = memo(function MemberList() {
  const inviteDialog = useToggle();

  const {
    filter,
    setFilter,
    filteredMembers: members,
    setMemberForRemove,
    applyFilter,
  } = useTeamStore();

  const [debouncedFilter] = useDebounce(filter, 500);

  useEffect(() => {
    applyFilter();
  }, [debouncedFilter, applyFilter]);

  const handleDelete = useCallback(
    (member: TeamMember) => {
      setMemberForRemove(member);
    },
    [setMemberForRemove]
  );

  const handleChangeSearch = useCallback(
    (query: string) => {
      setFilter((prevState) => ({ ...prevState, query }));
      if (query.length <= 0) {
        applyFilter();
      }
    },
    [applyFilter, setFilter]
  );

  return (
    <div>
      <InviteMembersDialog
        open={inviteDialog.isOn}
        onClose={inviteDialog.toggleOff}
      />

      <RemoveMemberDialog />

      <div className="grid gap-y-4">
        <Controls
          onInviteClick={inviteDialog.toggleOn}
          searchValue={filter.query}
          onSearchChange={handleChangeSearch}
        />

        <div className="space-x-2 text-neutral text-14 mt-4">
          <span>Member</span>

          <span className="bg-ebecef py-1 px-1.5 rounded-[4px]">
            {members.length}
          </span>
        </div>

        <div className="grid gap-y-4">
          {members.map((member, key) => (
            <div
              key={key}
              className="flex items-center bg-ffffff rounded-xl shadow-lg p-4 gap-3"
            >
              <div className="relative w-10 h-10 grid place-items-center bg-success-light rounded-full">
                <Icon name="user-solid" className="w-4 h-4 bg-success" />

                {member.verified && (
                  <Icon
                    name="badge-verification"
                    className="absolute w-5 h-5 -bottom-1 -right-1"
                    noMask
                  />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <h5>{member.name}</h5>
                <p className="text-12">{member.email}</p>
              </div>

              <button
                className="text-danger hover:opacity-75 transition-opacity"
                onClick={() => handleDelete(member)}
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
