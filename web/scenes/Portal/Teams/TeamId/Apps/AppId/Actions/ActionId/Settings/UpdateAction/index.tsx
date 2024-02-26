"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { MaxVerificationsSelector } from "../../../page/CreateActionModal/MaxVerificationsSelector";
import { GetActionNameDocument } from "../../Components/ActionsHeader/graphql/client/get-action-name.generated";
import { GetSingleActionQuery } from "../page/graphql/client/get-single-action.generated";
import { useUpdateActionMutation } from "./graphql/client/update-action.generated";

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
  action: GetSingleActionQuery["action"][0];
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

  const [updateActionQuery, { loading }] = useUpdateActionMutation({
    context: { headers: { team_id: teamId } },
  });

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
          refetchQueries: [GetActionNameDocument],
          awaitRefetchQueries: true,
        });

        if (result instanceof Error) {
          throw result;
        }
      } catch (error) {
        console.error(error);
        return toast.error("Error occurred while updating action.");
      }
      toast.success(`Action "${values.name}" updated.`);
    },
    [updateActionQuery, action.id],
  );

  return (
    <div className="grid min-h-full w-full items-start">
      <form
        onSubmit={handleSubmit(submit)}
        className="grid w-full grid-cols-1 gap-y-5"
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
          helperText="Tell your users what the action is for."
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
            <CopyButton
              fieldName="Action identifier"
              fieldValue={watch("action")}
            />
          }
          className=" h-16 text-grey-400"
        />

        <Input
          label="App ID"
          disabled
          helperText="The App ID associated with this action"
          placeholder={action.app_id}
          addOnRight={
            <CopyButton
              fieldName="Action identifier"
              fieldValue={action.app_id}
            />
          }
          className=" h-16 text-grey-400"
        />

        {action.app.engine !== EngineType.OnChain && (
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
                  required
                  className="w-full " // border is 2 px
                  label="Max verifications per user"
                  helperText="The number of verifications the same person can do for this action"
                />
              );
            }}
          />
        )}

        <div className="flex w-full justify-start">
          <DecoratedButton
            variant="primary"
            type="submit"
            disabled={!isValid || loading}
            className="mt-4 px-6 py-3"
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
