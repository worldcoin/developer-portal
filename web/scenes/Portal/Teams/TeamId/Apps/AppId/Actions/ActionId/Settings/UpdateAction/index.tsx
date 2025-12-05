"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { reformatPem } from "@/lib/crypto.client";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkIfPartnerTeam, checkIfProduction } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { AppFlowOnCompleteTypeSelector } from "../../../page/CreateActionModal/AppFlowOnCompleteTypeSelector";
import { MaxVerificationsSelector } from "../../../page/CreateActionModal/MaxVerificationsSelector";
import { GetActionNameDocument } from "../../Components/ActionsHeader/graphql/client/get-action-name.generated";
import {
  GetSingleActionDocument,
  GetSingleActionQuery,
} from "../page/graphql/client/get-single-action.generated";
import { updateActionServerSide } from "./server";
import {
  UpdateActionSchema,
  createUpdateActionSchema,
} from "./server/form-schema";

type UpdateActionProps = {
  teamId: string;
  action: GetSingleActionQuery["action"][0];
};

export const UpdateActionForm = (props: UpdateActionProps) => {
  const { action, teamId } = props;
  const isProduction = checkIfProduction();
  const isPartnerTeam = checkIfPartnerTeam(teamId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    watch,
    reset,
  } = useForm<UpdateActionSchema>({
    resolver: yupResolver(createUpdateActionSchema({ isProduction })),
    mode: "onChange",
    defaultValues: {
      name: action.name,
      description: action.description,
      action: action.action,
      max_verifications: action.max_verifications,
      app_flow_on_complete: action.app_flow_on_complete as "NONE" | "VERIFY",
      webhook_uri: action.webhook_uri ?? undefined,
      webhook_pem: action.webhook_pem ?? undefined,
      post_action_deep_link_ios: action.post_action_deep_link_ios ?? undefined,
      post_action_deep_link_android:
        action.post_action_deep_link_android ?? undefined,
    },
  });

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(
    action.app_flow_on_complete === "VERIFY" ||
      !!action.post_action_deep_link_ios ||
      !!action.post_action_deep_link_android,
  );

  const { refetch: refetchAction } = useRefetchQueries(GetActionNameDocument, {
    action_id: action.id,
  });

  const { refetch: refetchSingleAction } = useRefetchQueries(
    GetSingleActionDocument,
    {
      action_id: action.id,
    },
  );

  const submit = useCallback(
    async (values: UpdateActionSchema) => {
      setIsSubmitting(true);

      // Reformat PEM client-side before submission
      if (values.webhook_pem) {
        values.webhook_pem = reformatPem(values.webhook_pem);
      }

      const result = await updateActionServerSide(
        values,
        teamId,
        action.id,
        isProduction,
      );

      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(`Action "${values.name}" updated.`);
        await refetchAction();
        await refetchSingleAction();
        reset(values);
      }

      setIsSubmitting(false);
    },
    [
      teamId,
      action.id,
      isProduction,
      refetchAction,
      refetchSingleAction,
      reset,
    ],
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

        <div className={clsx("mt-6 space-y-4", isPartnerTeam ? "" : "hidden")}>
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
            <div className="space-y-6 border-l-2 border-grey-100 pl-4">
              <Controller
                name="app_flow_on_complete"
                control={control}
                render={({ field }) => (
                  <AppFlowOnCompleteTypeSelector
                    value={field.value ?? "NONE"}
                    onChange={field.onChange}
                    errors={errors.app_flow_on_complete}
                    label="App Flow on Complete"
                    helperText="Select what happens when the action is completed"
                    required
                  />
                )}
              />

              {watch("app_flow_on_complete") === "VERIFY" && (
                <div className="space-y-6 border-l-2 border-grey-100 pl-4">
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
                    label="Webhook RSA PEM"
                    placeholder={`-----BEGIN RSA PUBLIC KEY-----\nMII... (your key here) ...AB\n-----END RSA PUBLIC KEY-----\n\nor\n\n-----BEGIN PUBLIC KEY-----\nMII... (your key here) ...AB\n-----END PUBLIC KEY-----`}
                    helperText="Enter the full RSA public key in PEM format, including 'BEGIN' and 'END' lines. Both PKCS#1 (RSA PUBLIC KEY) and SPKI (PUBLIC KEY) formats are supported."
                    className="h-16"
                  />
                </div>
              )}

              <Input
                register={register("post_action_deep_link_ios")}
                errors={errors.post_action_deep_link_ios}
                label="Post-action deep link (iOS)"
                placeholder="e.g. worldapp:// or https://world.org"
                helperText="If specified, after action completion, allow users to continue to the iOS app specified by the deep link."
                className="h-16"
              />

              <Input
                register={register("post_action_deep_link_android")}
                errors={errors.post_action_deep_link_android}
                label="Post-action deep link (Android)"
                placeholder="e.g. worldapp:// or https://world.org"
                helperText="If specified, after action completion, allow users to continue to the Android app specified by the deep link."
                className="h-16"
              />
            </div>
          )}
        </div>
        <div className="flex w-full justify-start">
          <DecoratedButton
            variant="primary"
            type="submit"
            disabled={!isValid || isSubmitting}
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
