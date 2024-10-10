"use client";

import { Button } from "@/components/Button";
import { CategorySelector } from "@/components/Category";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";
import { RadioCard } from "./RadioCard";
import { useInsertAppMutation } from "./graphql/client/insert-app.generated";

const BUILD_TYPES = ["staging", "production"] as const;
const VERIFICATION_TYPES = ["cloud", "on-chain"] as const;

const createAppSchema = yup.object({
  appName: yup.string().required("This field is required"),
  build: yup.string().oneOf(BUILD_TYPES).default("production"),
  category: yup.string().required(),
  integration_url: yup.string().url("Must be a valid URL").optional(),
  verification: yup.string().oneOf(VERIFICATION_TYPES).default("cloud"),
  app_mode: yup
    .string()
    .oneOf(["mini-app", "external", "native"])
    .default("mini-app"),
});

type FormValues = yup.InferType<typeof createAppSchema>;

export const CreateAppDialog = (props: DialogProps) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();

  const defaultValues: Partial<FormValues> = useMemo(
    () => ({
      build: "production",
      verification: "cloud",
      app_mode: "mini-app",
      image: "/default.png", // FIXME: remove once image upload is implemented
    }),
    [],
  );

  const {
    register,
    formState: { isValid, errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(createAppSchema),
    defaultValues,
  });

  const appMode = useWatch({
    control: control,
    name: "app_mode",
  });

  const [insertApp] = useInsertAppMutation();

  const submit = useCallback(
    (values: FormValues) => {
      if (!teamId) {
        return toast.error("Failed to create app");
      }

      insertApp({
        variables: {
          name: values.appName,
          is_staging: values.build === "staging",
          engine: values.verification,
          team_id: teamId,
          category: values.category,
          integration_url:
            values.integration_url ?? "https://docs.worldcoin.org/",
          app_mode: values.app_mode,
        },

        refetchQueries: [FetchAppsDocument],

        onCompleted: (data) => {
          if (!data.insert_app_one) {
            toast.error("Failed to create app");
          }

          const redirect =
            appMode == "mini-app"
              ? urls.configuration({
                  team_id: teamId,
                  app_id: data.insert_app_one?.id ?? "",
                })
              : urls.actions({
                  team_id: teamId,
                  app_id: data.insert_app_one?.id ?? "",
                });

          router.prefetch(redirect);
          reset(defaultValues);

          posthog.capture("app_creation_successful", {
            team_id: teamId,
            app_id: data.insert_app_one?.id,
            environment: values.build,
            engine: values.verification,
          });

          router.push(redirect);
          props.onClose(false);
        },

        onError: () => {
          toast.error("Error while creating app");

          posthog.capture("app_creation_failed", {
            team_id: teamId,
            environment: values.build,
            engine: values.verification,
          });
        },
      });
    },
    [appMode, defaultValues, insertApp, props, reset, router, teamId],
  );

  const onClose = useCallback(() => {
    reset(defaultValues);
    props.onClose(false);
  }, [defaultValues, props, reset]);

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50 ">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button type="button" onClick={onClose} className="flex">
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  Create a new app
                </Typography>
              </div>
              <LoggedUserNav />
            </div>
          </SizingWrapper>
        </header>
        <div className="relative mt-10 grid w-full grid-rows-auto/1fr items-center pb-4">
          <SizingWrapper
            gridClassName="overflow-y-auto"
            className="flex items-start justify-center"
          >
            <form
              onSubmit={handleSubmit(submit)}
              className="grid w-full max-w-[580px] gap-y-6 justify-self-center py-10"
            >
              <Typography variant={TYPOGRAPHY.H6}>Setup your app</Typography>
              <div className="grid gap-y-6">
                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("app_mode")}
                    option={{ value: "mini-app", label: "Mini App" }}
                    description={`Create a mini app that runs inside the World App.`}
                    stampText="Recommended"
                  />

                  <RadioCard
                    register={register("app_mode")}
                    option={{ value: "external", label: "External" }}
                    description="Create a World ID app that runs outside the World App."
                  />
                </div>
              </div>

              <div className={clsx("grid gap-y-6")}>
                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("verification")}
                    option={{ value: "cloud", label: "Cloud" }}
                    description={`Verify your proofs using our public API endpoint.`}
                    stampText="Easiest"
                    testId="verification-cloud"
                  />

                  <RadioCard
                    register={register("verification")}
                    option={{ value: "on-chain", label: "On-chain" }}
                    description="Validate and store your proofs on the blockchain."
                    testId="verification-on-chain"
                  />
                </div>
              </div>

              <div
                className={clsx("grid gap-y-6", {
                  hidden: appMode === "mini-app",
                })}
              >
                <Typography variant={TYPOGRAPHY.H7}>Environment</Typography>

                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("build")}
                    option={{ value: "staging", label: "Staging" }}
                    description="Development environment for testing and debugging. Verify with the simulator."
                    testId="build-staging"
                  />

                  <RadioCard
                    register={register("build")}
                    option={{ value: "production", label: "Production" }}
                    description="Verify real humans. Use World App to verify."
                    testId="build-production"
                  />
                </div>
              </div>

              <div className="grid gap-y-8">
                <Input
                  register={register("appName")}
                  label="App name"
                  placeholder="Display name (ex. Voting app)"
                  required
                  errors={errors.appName}
                  data-testid="input-app-name"
                />
                <Input
                  register={register("integration_url")}
                  label="App URL"
                  placeholder="URL where users can access your app (ex. https://example.com)"
                  errors={errors.integration_url}
                />
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => {
                    return (
                      <CategorySelector
                        value={field.value}
                        required
                        disabled={false}
                        onChange={field.onChange}
                        errors={errors.category}
                        label="Category"
                        data-testid="category-selector"
                      />
                    );
                  }}
                />
              </div>

              <DecoratedButton
                type="submit"
                variant="primary"
                className="justify-self-end py-3"
                disabled={!isValid || isSubmitting}
                testId="create-app"
              >
                Create app
              </DecoratedButton>
            </form>
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
