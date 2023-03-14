import { FieldGroup } from "@/components/FieldGroup";
import { FieldInput } from "@/components/FieldInput";
import { KeyboardEvent, memo, useCallback, useRef } from "react";
import { TeamModel } from "@/lib/models";
import { useUpdateTeamNameMutation } from "@/hooks/useTeam";

export interface DetailsProps {
  team: TeamModel;
}

export const Details = memo(function Details(props: DetailsProps) {
  const { team } = props;

  const { updateTeamName } = useUpdateTeamNameMutation();

  const ref = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const newName = ref.current?.value;
    if (newName && newName !== team.name) {
      updateTeamName(team.id, newName);
    }
  }, [team, updateTeamName]);

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
    <FieldGroup label="Team name">
      <FieldInput
        ref={ref}
        defaultValue={team.name}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
      />
    </FieldGroup>
  );
});
