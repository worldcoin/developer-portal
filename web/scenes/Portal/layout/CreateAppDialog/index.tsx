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
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";
import { RadioCard } from "./RadioCard";
import { createAppSchema, CreateAppSchema } from "./form-schema";
import { validateAndInsertAppServerSide } from "./server/submit";

export const CreateAppDialog = (props: DialogProps) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument, {
    teamId: teamId,
  });

  const defaultValues: Partial<CreateAppSchema> = useMemo(
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
  } = useForm<CreateAppSchema>({
    mode: "onChange",
    resolver: yupResolver(createAppSchema),
    defaultValues,
  });

  const appMode = useWatch({
    control: control,
    name: "app_mode",
  });

  const submit = useCallback(
    async (values: CreateAppSchema) => {
      if (!teamId) {
        return toast.error("Failed to create app");
      }
      const result = await validateAndInsertAppServerSide(values, teamId);
      if (!result.success) {
        toast.error(result.message);
        posthog.capture("app_creation_failed", {
          team_id: teamId,
          environment: values.build,
          engine: values.verification,
          error: result?.error,
        });
      }
      const [refetched] = await refetchApps();

      const latestApp = refetched.data.app.toSorted(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      const redirect =
        appMode == "mini-app"
          ? urls.configuration({
              team_id: teamId,
              app_id: latestApp?.id ?? "",
            })
          : urls.actions({
              team_id: teamId,
              app_id: latestApp?.id ?? "",
            });

      router.prefetch(redirect);
      reset(defaultValues);

      posthog.capture("app_creation_successful", {
        team_id: teamId,
        app_id: latestApp?.id,
        environment: values.build,
        engine: values.verification,
      });

      router.push(redirect);
      props.onClose(false);
    },
    [appMode, defaultValues, props, refetchApps, reset, router, teamId],
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
                  register={register("name")}
                  label="App name"
                  placeholder="Display name (ex. Voting app)"
                  required
                  errors={errors.name}
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
