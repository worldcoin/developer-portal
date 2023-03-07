import { Illustration } from "@/components/Auth/Illustration";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { memo } from "react";
import { getTeamStore, useTeamStore } from "src/stores/teamStore";

export const RemoveMemberDialog = memo(function RemoveMemberDialog() {
  const { memberForRemove, setMemberForRemove, removeMember } =
    useTeamStore(getTeamStore);

  return (
    <Dialog
      open={memberForRemove !== null}
      onClose={() => setMemberForRemove(null)}
      panelClassName="flex flex-col space-y-8"
    >
      <div className="flex flex-col items-center space-y-6">
        <Illustration icon="warning-triangle" color="danger" />

        <div className="flex flex-col space-y-2 text-center">
          <span className="text-24 font-sora font-semibold">
            Remove team member
          </span>

          <span className="text-14">
            Remove team member Are you sure you want to remove your team member
            <b>&nbsp;{memberForRemove?.name}</b>?
          </span>
        </div>
      </div>

      <Button variant="danger" className="py-4.5 px-9" onClick={removeMember}>
        Delete member
      </Button>

      <Button variant="plain" onClick={() => setMemberForRemove(null)}>
        Cancel
      </Button>
    </Dialog>
  );
});
