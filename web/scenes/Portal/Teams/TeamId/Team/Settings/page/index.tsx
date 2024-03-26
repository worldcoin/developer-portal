"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { TeamProfile } from "../../common/TeamProfile";
import {
  FetchTeamDocument,
  useFetchTeamQuery,
} from "../../common/TeamProfile/graphql/client/fetch-team.generated";
import { useUpdateTeamMutation } from "./graphql/client/update-team.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Section } from "@/components/Section";

const schema = yup.object({
  name: yup.string().required("This is a required field"),
});

type FormValues = yup.InferType<typeof schema>;

export const TeamSettingsPage = () => {
  const { teamId } = useParams() as { teamId: string };

  const fetchTeamQueryRes = useFetchTeamQuery({
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

  const [updateTeam] = useUpdateTeamMutation();

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
          refetchQueries: [FetchTeamDocument, FetchMeDocument],
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
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Section>
          <Section.Header>
            <Section.Header.Title>Team settings</Section.Header.Title>
          </Section.Header>

          <form
            className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]"
            onSubmit={handleSubmit(submit)}
          >
            <Input
              label="Display name"
              register={register("name")}
              errors={errors.name}
            />

            <DecoratedButton
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
            >
              Save changes
            </DecoratedButton>
          </form>
        </Section>
      </SizingWrapper>
    </>
  );
};
