"use client";

import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { Image } from "./Image";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { RadioCard } from "./RadioCard";
import { useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/Button";
import { useInsertAppMutation } from "./graphql/client/insert-app.generated";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { urls } from "@/lib/urls";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";

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
  const imageInputRef = useRef<HTMLInputElement>(null);

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

          props.onClose(false);
          reset(defaultValues);
          router.push(
            urls.app({ team_id: teamId, app_id: data.insert_app_one?.id }),
          );
        },

        onError: () => {
          toast.error("Error while creating app");
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
        <div className="grid grid-rows-auto/1fr items-center h-[100dvh]">
          <SizingWrapper gridClassName="bg-grey-0 z-10">
            <header className="w-full flex justify-between items-center min-h-9 py-4">
              <div className="flex gap-3 w-full items-center">
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
            className="flex justify-center items-start"
          >
            <form
              onSubmit={handleSubmit(submit)}
              className="w-full max-w-[580px] justify-self-center grid gap-y-8 py-10"
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
                          <SelectButton className="w-full grid grid-cols-1fr/auto items-center text-start relative py-3">
                            <Typography variant={TYPOGRAPHY.R3}>
                              {field.value ?? "Select a category"}
                            </Typography>

                            <fieldset className="absolute inset-x-0 bottom-0 top-[-12px] border border-grey-200 rounded-lg pointer-events-none">
                              <legend className="text-grey-400 ml-4 px-0.5">
                                <Typography variant={TYPOGRAPHY.R4}>
                                  Category
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
                                className="hover:bg-grey-100 transition"
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
                            {errors.category?.message} qwer
                          </Typography>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Build</Typography>

                <div className="grid grid-cols-2 gap-x-2">
                  <RadioCard
                    register={register("build")}
                    option={{ value: "staging", label: "Staging" }}
                    description="Pre-release environment for code changes"
                    stampText="Recommended"
                  />

                  <RadioCard
                    register={register("build")}
                    option={{ value: "production", label: "Production" }}
                    description="Live environment accessible to end-users"
                  />
                </div>
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Verification</Typography>

                <div className="grid grid-cols-2 gap-x-2">
                  <RadioCard
                    register={register("verification")}
                    option={{ value: "cloud", label: "Cloud" }}
                    description="Pre-release environment for code changes"
                    stampText="Easiest"
                  />

                  <RadioCard
                    register={register("verification")}
                    option={{ value: "on-chain", label: "On-chain" }}
                    description="Live environment accessible to end-users"
                  />
                </div>
              </div>

              <DecoratedButton
                type="submit"
                variant="primary"
                className="py-3 justify-self-end"
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
