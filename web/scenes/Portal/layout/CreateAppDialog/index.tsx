"use client";

import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";
import { RadioCard } from "./RadioCard";
import { useInsertAppMutation } from "./graphql/client/insert-app.generated";

const CATEGORIES = ["Social", "Gaming", "Business", "Finance", "Productivity"];
const BUILD_TYPES = ["staging", "production"] as const;
const VERIFICATION_TYPES = ["cloud", "on-chain"] as const;

const createAppSchema = yup.object({
  image: yup.string().required(),
  appName: yup.string().required("This field is required"),
  category: yup.string().oneOf(CATEGORIES).required("This field is required"),
  build: yup.string().oneOf(BUILD_TYPES).required("This field is required"),
  verification: yup
    .string()
    .oneOf(VERIFICATION_TYPES)
    .required("This field is required"),
});

type FormValues = yup.InferType<typeof createAppSchema>;

export const CreateAppDialog = (props: DialogProps) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();

  const defaultValues: Partial<FormValues> = useMemo(
    () => ({
      build: "staging",
      verification: "cloud",
      image: "/default.png", // FIXME: remove once image upload is implemented
    }),
    [],
  );

  const {
    register,
    control,
    formState: { isValid, errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(createAppSchema),
    defaultValues,
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
          category: values.category,
          is_staging: values.build === "staging",
          engine: values.verification,
        },

        refetchQueries: [
          {
            query: FetchAppsDocument,
            context: { headers: { team_id: teamId } },
          },
        ],

        context: { headers: { team_id: teamId } },

        onCompleted: (data) => {
          if (!data.insert_app_one) {
            toast.error("Failed to create app");
          }
          const redirect = urls.actions({
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
    [defaultValues, insertApp, props, reset, router, teamId],
  );

  const onClose = useCallback(() => {
    reset(defaultValues);
    props.onClose(false);
  }, [defaultValues, props, reset]);

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50">
      <DialogPanel className={clsx("fixed inset-0 p-0", props.className)}>
        <div className="grid h-[100dvh] grid-rows-auto/1fr items-center">
          <SizingWrapper gridClassName="bg-grey-0 z-10">
            <header className="flex min-h-9 w-full items-center justify-between py-4">
              <div className="flex w-full items-center gap-3">
                <Button type="button" onClick={onClose}>
                  <CloseIcon />
                </Button>

                <span className="text-grey-200">|</span>

                <Typography className="font-[500]" variant={TYPOGRAPHY.R4}>
                  Create a new app
                </Typography>
              </div>

              <div className="flex justify-end ">
                <LoggedUserNav />
              </div>
            </header>
          </SizingWrapper>

          <SizingWrapper
            gridClassName="overflow-y-auto no-scrollbar"
            className="flex items-start justify-center"
          >
            <form
              onSubmit={handleSubmit(submit)}
              className="grid w-full max-w-[580px] gap-y-10 justify-self-center py-10"
            >
              <Typography variant={TYPOGRAPHY.H6}>Setup your app</Typography>

              <div className="grid gap-y-8">
                <Input
                  register={register("appName")}
                  label="App name"
                  placeholder="Name will be visible to the users"
                  required
                  errors={errors.appName}
                />

                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => {
                    return (
                      <div>
                        <Select onChange={field.onChange}>
                          <SelectButton className="relative grid w-full grid-cols-1fr/auto items-center py-3 text-start">
                            <Typography variant={TYPOGRAPHY.R3}>
                              {field.value ?? "Select a category"}
                            </Typography>

                            <fieldset className="pointer-events-none absolute inset-x-0 bottom-0 top-[-12px] rounded-lg border border-grey-200">
                              <legend className="ml-4 px-0.5 text-grey-400">
                                <Typography variant={TYPOGRAPHY.R4}>
                                  Category{" "}
                                  <span className="text-system-error-500">
                                    *
                                  </span>
                                </Typography>
                              </legend>
                            </fieldset>

                            <CaretIcon />
                          </SelectButton>

                          <SelectOptions className="mt-2">
                            {CATEGORIES.map((category, i) => (
                              <SelectOption
                                key={`create-app-category-${category}-${i}`}
                                value={category}
                                className="transition hover:bg-grey-100"
                              >
                                {category}
                              </SelectOption>
                            ))}
                          </SelectOptions>
                        </Select>

                        {errors.category?.message && (
                          <Typography
                            variant={TYPOGRAPHY.R5}
                            className="text-system-error-500"
                          >
                            {errors.category?.message}
                          </Typography>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Build</Typography>

                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("build")}
                    option={{ value: "staging", label: "Staging" }}
                    description="Development environment for testing and debugging."
                    stampText="Recommended"
                  />

                  <RadioCard
                    register={register("build")}
                    option={{ value: "production", label: "Production" }}
                    description="Live environment accessible to verified user. Use a World ID compatible app to verify."
                  />
                </div>
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Verification</Typography>

                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("verification")}
                    option={{ value: "cloud", label: "Cloud" }}
                    description={`Verify your proofs using our public API endpoint. Also choose this if you're using Sign in With World ID.`}
                    stampText="Easiest"
                  />

                  <RadioCard
                    register={register("verification")}
                    option={{ value: "on-chain", label: "On-chain" }}
                    description="Use World ID and validate your proofs via a transaction on the blockchain."
                  />
                </div>
              </div>

              <DecoratedButton
                type="submit"
                variant="primary"
                className="justify-self-end py-3"
                disabled={!isValid || isSubmitting}
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
