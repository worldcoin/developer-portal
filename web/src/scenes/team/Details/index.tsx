import { FieldGroup } from "@/components/FieldGroup";
import { FieldInput } from "@/components/FieldInput";
import { KeyboardEvent, memo, useCallback, useEffect, useMemo } from "react";
import { Team, useUpdateTeamName } from "@/scenes/team/hooks/useTeam";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export interface DetailsProps {
  team: Team;
}

type FormData = {
  teamName: string;
};

export const Details = memo(function Details(props: DetailsProps) {
  const team = useMemo(() => props.team, [props.team]);
  const { updateTeamName } = useUpdateTeamName();

  const { register, handleSubmit, formState, reset } = useForm<FormData>({
    defaultValues: {
      teamName: team.name ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    reset({
      teamName: team.name ?? "",
    });
  }, [reset, team.name]);

  const submit = useCallback(
    async (values: FormData) => {
      if (!formState.isDirty) {
        return;
      }

      await updateTeamName({
        id: team.id,
        name: values.teamName,

        onCompleted: (data) => {
          if (!data.team) {
            toast.error("Team members can't update team name");
            return reset({ teamName: team.name ?? "" });
          }

          toast.success("Team name updated");
          reset(values);
        },
      });
    },
    [formState.isDirty, reset, team.id, team.name, updateTeamName]
  );

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit(submit)();
      }
    },
    [handleSubmit, submit]
  );

  return (
    <FieldGroup label="Team name">
      <FieldInput
        {...register("teamName")}
        onBlur={handleSubmit(submit)}
        onKeyPress={handleKeyPress}
      />
    </FieldGroup>
  );
});
