"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { AppFlowOnCompleteTypeSelector } from "../../../page/CreateActionModal/AppFlowOnCompleteTypeSelector";
import { MaxVerificationsSelector } from "../../../page/CreateActionModal/MaxVerificationsSelector";
import { GetActionNameDocument } from "../../Components/ActionsHeader/graphql/client/get-action-name.generated";
import { GetSingleActionQuery } from "../page/graphql/client/get-single-action.generated";
import { useUpdateActionMutation } from "./graphql/client/update-action.generated";

const rsaPublicKeyRegex =
  /^-----BEGIN RSA PUBLIC KEY-----\s+([A-Za-z0-9+/=\s]+)-----END RSA PUBLIC KEY-----\s*$/;

const updateActionSchema = yup
  .object({
    name: yup.string().required("This field is required"),
    description: yup.string().required(),
    action: yup.string().required("This field is required"),
    max_verifications: yup
      .number()
      .typeError("Max verifications must be a number")
      .required("This field is required"),
    app_flow_on_complete: yup
      .string()
      .oneOf(["NONE", "VERIFY"])
      .required("This field is required"),
    webhook_uri: yup.string().optional().url("Must be a valid URL"),
    webhook_pem: yup.string().optional().matches(rsaPublicKeyRegex, {
      message:
        "Must be a valid RSA public key in PEM format (BEGIN/END lines, base64 data).",
      excludeEmptyString: true,
    }),
  })
  .test(
    "webhook-fields",
    "Both webhook URL and PEM must be provided or removed",
    function (values) {
      const { webhook_uri, webhook_pem, app_flow_on_complete } = values;
      if (app_flow_on_complete !== "NONE") return true;

      if (!!webhook_uri !== !!webhook_pem) {
        const errorPath = !webhook_uri ? "webhook_uri" : "webhook_pem";
        return this.createError({
          path: errorPath,
          message: "Both webhook URL and PEM must be provided or removed",
        });
      }
      return true;
    },
  );

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
    reset,
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(updateActionSchema),
    mode: "onChange",
    defaultValues: {
      name: action.name,
      description: action.description,
      action: action.action,
      max_verifications: action.max_verifications,
      app_flow_on_complete: action.app_flow_on_complete as "NONE" | "VERIFY",
      webhook_uri: action.app_flow_on_complete === "VERIFY" ? action.webhook_uri ?? undefined : undefined,
      webhook_pem: action.app_flow_on_complete === "VERIFY" ? action.webhook_pem ?? undefined : undefined,
    },
  });

  const [updateActionQuery, { loading }] = useUpdateActionMutation();
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(
    action.app_flow_on_complete === "VERIFY"
  );

  const appFlowOnComplete = watch("app_flow_on_complete");

  const submit = useCallback(
    async (values: NewActionFormValues) => {
      try {
        const { data, errors } = await updateActionQuery({
          variables: {
            id: action.id,
            input: {
              name: values.name,
              description: values.description,
              max_verifications: values.max_verifications,
              app_flow_on_complete: values.app_flow_on_complete,
              webhook_uri: values.webhook_uri,
              webhook_pem: values.webhook_pem,
            },
          },
          refetchQueries: [GetActionNameDocument],
          awaitRefetchQueries: true,
        });

        if (errors) {
          throw new Error(errors[0].message);
        }

        if (!data?.update_action_by_pk) {
          throw new Error("Failed to update action");
        }

        toast.success(`Action "${values.name}" updated.`);

        reset(values);
      } catch (error) {
        console.error("Update Action: ", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Error occurred while updating action."
        );
      }
    },
    [updateActionQuery, action.id, reset],
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
          className="h-16 text-grey-400"
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
          className="h-16 text-grey-400"
        />

        {action.app.engine !== EngineType.OnChain && (
          <Controller
            name="max_verifications"
            control={control}
            render={({ field }) => {
              return (
                <MaxVerificationsSelector
                  value={field.value}
                  onChange={field.onChange}
                  errors={errors.max_verifications}
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

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant={TYPOGRAPHY.R3} className="font-medium">
              Advanced Configuration
            </Typography>
            <Toggle
              checked={showAdvancedConfig}
              onChange={() => setShowAdvancedConfig(!showAdvancedConfig)}
            />
          </div>

          {showAdvancedConfig && (
            <div className="space-y-6 pl-4 border-l-2 border-grey-100">
              <Controller
                name="app_flow_on_complete"
                control={control}
                render={({ field }) => (
                  <AppFlowOnCompleteTypeSelector
                    value={field.value}
                    onChange={field.onChange}
                    errors={errors.app_flow_on_complete}
                    label="App Flow on Complete"
                    helperText="Select what happens when the action is completed"
                    required
                  />
                )}
              />

              {watch("app_flow_on_complete") === "VERIFY" && (
                <div className="space-y-6 pl-4 border-l-2 border-grey-100">
                  <Input
                    register={register("webhook_uri")}
                    errors={errors.webhook_uri}
                    label="Webhook URL"
                    placeholder="https://your-webhook-endpoint.com"
                    helperText="Enter the full URL where webhook payloads will be sent. Must start with 'https://'."
                    className="h-16"
                  />

                  <Input
                    register={register("webhook_pem")}
                    errors={errors.webhook_pem}
                    label="Webhook PEM"
                    placeholder={`-----BEGIN RSA PUBLIC KEY-----\nMII... (your key here) ...AB\n-----END RSA PUBLIC KEY-----`}
                    helperText="Enter the full RSA public key in PEM format, including 'BEGIN' and 'END' lines."
                    className="h-16"
                  />
                </div>
              )}
            </div>
          )}
        </div>

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