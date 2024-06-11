"use client";

import { Button } from "@/components/Button";
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
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";
import { RadioCard } from "./RadioCard";
import { useInsertAppMutation } from "./graphql/client/insert-app.generated";

const BUILD_TYPES = ["staging", "production"] as const;
const VERIFICATION_TYPES = ["cloud", "on-chain"] as const;

const createAppSchema = yup.object({
  image: yup.string().required(),
  appName: yup.string().required("This field is required"),
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
          is_staging: values.build === "staging",
          engine: values.verification,
          team_id: teamId,
        },

        refetchQueries: [FetchAppsDocument],

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
    <Dialog open={props.open} onClose={onClose} className="z-50 ">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="relative z-10 max-h-[56px] w-full border-b border-grey-100 py-4">
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
        <div className="grid w-full grid-rows-auto/1fr items-center pb-4">
          <SizingWrapper
            gridClassName="overflow-y-auto"
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
                  placeholder="Display name (ex. Voting app)"
                  required
                  errors={errors.appName}
                />
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Build</Typography>

                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("build")}
                    option={{ value: "staging", label: "Staging" }}
                    description="Development environment for testing and debugging. Verify with the simulator."
                    stampText="Recommended"
                  />

                  <RadioCard
                    register={register("build")}
                    option={{ value: "production", label: "Production" }}
                    description="Verify real humans. Use World App to verify."
                  />
                </div>
              </div>

              <div className="grid gap-y-6">
                <Typography variant={TYPOGRAPHY.H7}>Verification</Typography>

                <div className="grid gap-2 md:grid-cols-2">
                  <RadioCard
                    register={register("verification")}
                    option={{ value: "cloud", label: "Cloud" }}
                    description={`Verify your proofs using our public API endpoint.`}
                    stampText="Easiest"
                  />

                  <RadioCard
                    register={register("verification")}
                    option={{ value: "on-chain", label: "On-chain" }}
                    description="Validate and store your proofs on the blockchain."
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
