import { Dialog } from "@/components/Dialog2";
import { KeyboardEvent, memo, useCallback, useRef } from "react";
import { Button } from "@/components/Button2";
import { FieldInput } from "@/components/FieldInput2";
import { Team, useUpdateTeamName } from "@/scenes/team/hooks/useTeam";

export interface RemoveMemberDialogProps {
  team: Team;
  open: boolean;
  onClose: () => void;
}

export const EditDialog = memo(function EditDialog(
  props: RemoveMemberDialogProps
) {
  const { team, onClose } = props;
  const { updateTeamName } = useUpdateTeamName();

  const ref = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const newName = ref.current?.value;
    if (newName && newName !== team.name) {
      updateTeamName(team.id, newName).then(() => {
        onClose();
      });
    }
  }, [team, updateTeamName, onClose]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      panelClassName="flex flex-col"
    >
      <div className="leading-7 font-medium text-20 text-gray-900">
        Team name
      </div>

      <div className="mt-2 leading-5 text-14 text-gray-500">
        Here you can update name of your team
      </div>

      <div className="mt-5">
        <FieldInput
          ref={ref}
          label="Name"
          defaultValue={team.name ?? ""}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
        />
      </div>

      <div className="grid grid-cols-2 items-center space-x-3 mt-7">
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>

        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
});
