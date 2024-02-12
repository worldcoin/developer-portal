"use client";
import { TeamProfile } from "../../common/TeamProfile";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback } from "react";
import {
  FetchTeamDocument,
  useFetchTeamQuery,
} from "../../common/TeamProfile/graphql/client/fetch-team.generated";
import { useParams } from "next/navigation";
import { useUpdateTeamMutation } from "./graphql/client/update-team.generated";
import { toast } from "react-toastify";

const schema = yup.object({
  name: yup.string().required("This is a required field"),
});

type FormValues = yup.InferType<typeof schema>;

export const TeamSettingsPage = () => {
  const { teamId } = useParams() as { teamId: string };

  const fetchTeamQueryRes = useFetchTeamQuery({
    context: { headers: { team_id: teamId } },
    variables: {
      teamId: teamId,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    values: {
      name: fetchTeamQueryRes.data?.team_by_pk?.name ?? "",
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const [updateTeam] = useUpdateTeamMutation({
    context: { headers: { team_id: teamId } },
  });

  const submit = useCallback(
    async (values: FormValues) => {
      try {
        await updateTeam({
          variables: {
            id: teamId,
            input: {
              name: values.name,
            },
          },
          refetchQueries: [FetchTeamDocument],
        });
        toast.success("Your team was successfully updated");
      } catch (error) {
        console.error(error);
        toast.error("Error updating team");
      }
    },
    [teamId, updateTeam],
  );

  return (
    <div>
      <TeamProfile />

      <div className="grid gap-y-8 m-auto py-8">
        <Typography as="h1" variant={TYPOGRAPHY.H7}>
          Profile settings
        </Typography>
      </div>

      <form
        className="grid gap-y-8 max-w-[36.25rem]"
        onSubmit={handleSubmit(submit)}
      >
        <Input
          className="-mt-2"
          label="Display name"
          register={register("name")}
          errors={errors.name}
        />

        <div>
          <DecoratedButton
            type="submit"
            variant="primary"
            className="py-4"
            disabled={!isValid || isSubmitting}
          >
            Save changes
          </DecoratedButton>
        </div>
      </form>
    </div>
  );
};
