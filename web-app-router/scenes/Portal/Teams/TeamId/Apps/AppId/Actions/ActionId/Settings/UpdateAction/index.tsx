"use client";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { useUpdateActionMutation } from "./graphql/client/update-action.generated";
import { MaxVerificationsSelector } from "../../../page/CreateActionModal/MaxVerificationsSelector";
import { GetSingleActionDocument } from "../page/graphql/client/get-single-action.generated";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

const updateActionSchema = yup.object({
  name: yup.string().required("This field is required"),
  description: yup.string().required(),
  action: yup.string().required("This field is required"),
  maxVerifications: yup
    .number()
    .typeError("Max verifications must be a number")
    .required("This field is required"),
});

export type NewActionFormValues = yup.Asserts<typeof updateActionSchema>;

type UpdateActionProps = {
  teamId: string;
  action: {
    id: string;
    name: string;
    description: string;
    action: string;
    max_verifications: number;
  };
};

export const UpdateActionForm = (props: UpdateActionProps) => {
  const { action, teamId } = props;
  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    watch,
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(updateActionSchema),
    mode: "onChange",
    defaultValues: {
      name: action.name,
      description: action.description,
      action: action.action,
      maxVerifications: action.max_verifications,
    },
  });

  const [updateActionQuery, { loading }] = useUpdateActionMutation({});
  const submit = useCallback(
    async (values: NewActionFormValues) => {
      try {
        const result = await updateActionQuery({
          variables: {
            id: action.id,
            input: {
              name: values.name,
              description: values.description,
              max_verifications: values.maxVerifications,
            },
          },
          context: { headers: { team_id: teamId } },
          refetchQueries: [
            {
              query: GetSingleActionDocument,
              variables: { action_id: action.id },
              context: { headers: { team_id: teamId } },
            },
          ],
          awaitRefetchQueries: true,
        });

        if (result instanceof Error) {
          throw result;
        }
        // TODO: Turn on Posthog
        // posthog.capture("action_created", {
        //   name: values.name,
        //   app_id: currentApp.id,
        //   action_id: values.action,
        // });
      } catch (error) {
        console.error(error);
        return toast.error("Error occurred while updating action.");
      }
      toast.success(`Action "${values.name}" updated.`);
    },
    [updateActionQuery, action.id],
  );

  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(watch("action"));
    toast.success("Copied to clipboard");
  }, [watch]);

  return (
    <div className="w-full grid min-h-full items-start">
      <form
        onSubmit={handleSubmit(submit)}
        className="gap-y-5 w-full grid grid-cols-1"
      >
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Settings
        </Typography>
        <Input
          register={register("name")}
          errors={errors.name}
          label="Action Name"
          placeholder="Anonymous Vote #12"
          required
          className="h-16"
        />
        <Input
          register={register("description")}
          errors={errors.description}
          label="Short Description"
          placeholder="Cast your vote on proposal #102"
          helperText="Tell your users what the action is about. Shown in the World App."
          required
          className="h-16"
        />
        <Input
          register={register("action")}
          errors={errors.action}
          label="Identifier"
          helperText="This is the value you will use in IDKit and any API calls."
          placeholder="A short description of your action"
          disabled
          addOnRight={
            <button className="px-1" type="button" onClick={copyAction}>
              <CopyIcon />
            </button>
          }
          className=" text-grey-400 h-16"
        />
        <Controller
          name="maxVerifications"
          control={control}
          render={({ field }) => {
            return (
              <MaxVerificationsSelector
                value={field.value}
                onChange={field.onChange}
                errors={errors.maxVerifications}
                showCustomInput
                className="w-full " // border is 2 px
                label="Max verifications per user"
                helperText="The number of verifications the same person can do for this action"
              />
            );
          }}
        />

        <div className="w-full flex justify-start">
          <DecoratedButton
            variant="primary"
            type="submit"
            disabled={!isValid || loading}
            className="px-6 py-3 mt-4"
          >
            <Typography variant={TYPOGRAPHY.R4} className="text-white">
              Save Changes
            </Typography>
          </DecoratedButton>
        </div>
      </form>
    </div>
  );
};
