"use client";

import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { reformatPem } from "@/lib/crypto.client";
import { EngineType } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkIfPartnerTeam, checkIfProduction } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import slugify from "slugify";
import { GetActionsDocument } from "../graphql/client/actions.generated";
import { AppFlowOnCompleteTypeSelector } from "./AppFlowOnCompleteTypeSelector";
import { MaxVerificationsSelector } from "./MaxVerificationsSelector";
import { createActionServerSide } from "./server";
import { createActionSchema, CreateActionSchema } from "./server/form-schema";

type CreateActionModalProps = {
  className?: string;
  firstAction?: boolean;
  engineType?: string;
  appIsStaging?: boolean;
};

export const CreateActionModal = (props: CreateActionModalProps) => {
  const { className, firstAction, engineType } = props;
  const pathname = usePathname() ?? "";
  const params = useParams();
  const router = useRouter();
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as string;
  const isProduction = checkIfProduction();
  const isPartnerTeam = checkIfPartnerTeam(teamId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    setFocus,
  } = useForm<CreateActionSchema>({
    resolver: yupResolver(createActionSchema({ isProduction })),
    mode: "onChange",
    defaultValues: {
      max_verifications: 1,
      app_flow_on_complete: "NONE",
    },
  });

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    setFocus("name");
  }, [setFocus, firstAction]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name !== "name") {
        return;
      }

      setValue("action", slugify(value.name ?? "", { lower: true }), {
        shouldDirty: true,
      });
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  const { refetch: refetchActions } = useRefetchQueries(GetActionsDocument, {
    app_id: appId,
    condition: {},
  });

  const submit = useCallback(
    async (values: CreateActionSchema) => {
      setIsSubmitting(true);

      // Reformat PEM client-side before submission
      if (values.webhook_pem) {
        values.webhook_pem = reformatPem(values.webhook_pem);
      }

      const result = await createActionServerSide(
        values,
        teamId,
        appId,
        isProduction,
      );

      if (!result.success) {
        posthog.capture("action_creation_failed", {
          name: values.name,
          app_id: appId,
          is_first_action: firstAction,
          error: result?.error,
        });
        toast.error(result.message);
      } else {
        const action_id = result.action_id;
        posthog.capture("action_created", {
          name: values.name,
          app_id: appId,
          action_id: action_id,
          is_first_action: firstAction,
        });

        await refetchActions();
        router.refresh();
        reset();

        if (firstAction) {
          router.prefetch(`${pathname}/${action_id}/settings`);
          router.replace(`${pathname}/${action_id}/settings`);
        } else {
          router.prefetch(pathname);
          router.replace(pathname);
        }

        toast.success(`Action "${values.name}" created.`);
      }

      setIsSubmitting(false);
    },
    [
      appId,
      firstAction,
      teamId,
      isProduction,
      refetchActions,
      reset,
      router,
      pathname,
    ],
  );

  return (
    <div
      className={clsx(
        "fixed inset-0 z-10 grid w-full justify-center bg-white",
        className,
      )}
    >
      <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr">
        <header className="max-h-[56px] w-full border-b border-grey-100 py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button href={pathname} className="flex">
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  Create an action
                </Typography>
              </div>
              <LoggedUserNav />
            </div>
          </SizingWrapper>
        </header>

        <SizingWrapper
          gridClassName="overflow-y-auto no-scrollbar"
          className="flex items-center justify-center"
        >
          <form
            onSubmit={handleSubmit(submit)}
            className="grid w-full max-w-[580px] grid-cols-1 gap-6 py-10"
          >
            <Typography className="mb-2" variant={TYPOGRAPHY.H6}>
              Create an incognito action
            </Typography>
            <Input
              register={register("name")}
              errors={errors.name}
              label="Name"
              placeholder="Anonymous Vote #12"
              data-testid="input-name"
              required
            />
            <Input
              register={register("description")}
              errors={errors.description}
              label="Short Description"
              placeholder="Cast your vote on proposal #102"
              helperText="Tell your users what the action is for."
              data-testid="input-description"
              required
            />
            <Input
              register={register("action")}
              errors={errors.action}
              label="Identifier"
              helperText="This is the value you will use in IDKit and any API calls."
              placeholder="A short description of your action"
              data-testid="input-id"
              required
              addOnRight={
                <CopyButton
                  fieldName="Action identifier"
                  fieldValue={watch("action")}
                />
              }
            />
            {engineType !== EngineType.OnChain && (
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
                      label="Max verifications per user"
                      helperText="The number of verifications the same person can do for this action"
                    />
                  );
                }}
              />
            )}

            <div
              className={clsx("mt-6 space-y-4", isPartnerTeam ? "" : "hidden")}
            >
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
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex w-full justify-end">
              <DecoratedButton
                variant="primary"
                type="submit"
                disabled={!isValid || isSubmitting}
                className="px-10 py-3"
                testId="create-action-modal"
              >
                <Typography variant={TYPOGRAPHY.R3}>Create Action</Typography>
              </DecoratedButton>
            </div>
          </form>
        </SizingWrapper>
      </div>
    </div>
  );
};
