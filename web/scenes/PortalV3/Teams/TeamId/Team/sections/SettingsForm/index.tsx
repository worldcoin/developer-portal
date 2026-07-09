"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Section } from "@/components/Section";
import { teamNameSchema } from "@/lib/schema";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { validateAndUpdateTeamServerSide } from "../../Settings/server/submit";

const schema = yup
  .object({
    name: teamNameSchema,
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

// Team name comes from the parent settings page (single fetch); `onSaved` lets
// the parent refetch after a successful update so its copy stays in sync.
export const TeamSettingsForm = (props: {
  teamId: string;
  teamName: string;
  onSaved?: () => void;
}) => {
  const { teamId, teamName, onSaved } = props;
  const { refetch: refetchMe } = useRefetchQueries(FetchMeDocument);

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    values: {
      name: teamName,
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
        await Promise.all([onSaved?.(), refetchMe()]);
      }
    },
    [teamId, onSaved, refetchMe],
  );

  return (
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
  );
};
