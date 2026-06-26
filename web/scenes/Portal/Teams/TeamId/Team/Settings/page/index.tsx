"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { teamNameSchema } from "@/lib/schema";
import { truncateString } from "@/lib/utils";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { DeleteTeamDialog } from "@/scenes/Portal/common/DeleteTeamDialog";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { TeamProfile } from "../../common/TeamProfile";
import { useFetchTeamQuery } from "../../common/TeamProfile/graphql/client/fetch-team.generated";
import { validateAndUpdateTeamServerSide } from "../server/submit";

const schema = yup
  .object({
    name: teamNameSchema,
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

export const TeamSettingsPage = () => {
  const { teamId } = useParams() as { teamId: string };
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const { refetch: refetchMe } = useRefetchQueries(FetchMeDocument);

  const { data: fetchTeamQueryRes, refetch: refetchTeam } = useFetchTeamQuery({
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
      name: fetchTeamQueryRes?.team_by_pk?.name ?? "",
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const submit = useCallback(
    async (values: FormValues) => {
      const result = await validateAndUpdateTeamServerSide(values.name, teamId);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Your team was successfully updated");
        await Promise.all([refetchTeam(), refetchMe()]);
      }
    },
    [teamId, refetchTeam, refetchMe],
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

        <Section>
          <Section.Header>
            <Section.Header.Title>Danger zone</Section.Header.Title>
          </Section.Header>

          <div className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]">
            <p className="text-grey-500">
              This will immediately and permanently delete the team{" "}
              <strong className="font-medium text-grey-900">
                {truncateString(fetchTeamQueryRes?.team_by_pk?.name, 30)}
              </strong>
              , along with all its applications and its data for everyone. This
              cannot be undone.
            </p>

            <DecoratedButton
              type="button"
              variant="danger"
              onClick={() => setIsOpenDeleteDialog(true)}
            >
              Delete team
            </DecoratedButton>
          </div>
        </Section>
      </SizingWrapper>

      <DeleteTeamDialog
        open={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        team={{
          id: fetchTeamQueryRes?.team_by_pk?.id,
          name: fetchTeamQueryRes?.team_by_pk?.name,
        }}
      />
    </>
  );
};
