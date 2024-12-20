"use client";

import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  allowedCommonCharactersRegex,
  allowedTitleCharactersRegex,
} from "@/lib/schema";
import { EngineType } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { ApolloError } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import slugify from "slugify";
import * as yup from "yup";
import { GetActionsDocument } from "../graphql/client/actions.generated";
import { MaxVerificationsSelector } from "./MaxVerificationsSelector";
import { createActionServerSide } from "./server";

const createActionSchema = yup.object({
  name: yup
    .string()
    .matches(
      allowedTitleCharactersRegex,
      "Name must contain only common characters",
    )
    .required("This field is required"),
  description: yup
    .string()
    .matches(
      allowedCommonCharactersRegex,
      "Description must contain only common characters",
    )
    .required(),
  action: yup.string().required("This field is required"),
  max_verifications: yup
    .number()
    .typeError("Max verifications must be a number")
    .required("This field is required"),
});

export type NewActionFormValues = yup.Asserts<typeof createActionSchema>;

type CreateActionModalProps = {
  className?: string;
  firstAction?: boolean;
  engineType?: string;
};

export const CreateActionModal = (props: CreateActionModalProps) => {
  const { className, firstAction, engineType } = props;
  const pathname = usePathname() ?? "";
  const params = useParams();
  const router = useRouter();
  const appId = params?.appId as `app_${string}`;

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
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(createActionSchema),
    mode: "onChange",
    defaultValues: {
      max_verifications: 1,
    },
  });

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
  });

  const submit = useCallback(
    async (values: NewActionFormValues) => {
      try {
        const result = await createActionServerSide({
          ...values,
          app_id: appId,
        });

        if (result instanceof Error) {
          throw result;
        }
        const action_id = result.action_id;

        posthog.capture("action_created", {
          name: values.name,
          app_id: appId,
          action_id: action_id,
          is_first_action: firstAction,
        });

        const refetchResult = await refetchActions();
        console.log("refetchResult", refetchResult);
        reset();
        if (firstAction) {
          router.prefetch(`${pathname}/${action_id}/settings`);
          router.replace(`${pathname}/${action_id}/settings`);
        } else {
          router.prefetch(pathname);
          router.replace(pathname);
        }
      } catch (error) {
        posthog.capture("action_creation_failed", {
          name: values.name,
          app_id: appId,
          is_first_action: firstAction,
          error: error,
        });

        if (
          (error as ApolloError).graphQLErrors[0].extensions.code ===
          "constraint-violation"
        ) {
          setError("action", {
            type: "custom",
            message: "This action already exists.",
          });
          return toast.error(
            "An action with this identifier already exists for this app. Please change the 'action' identifier.",
          );
        }
        return toast.error("Error occurred while creating action.");
      }
      toast.success(`Action "${values.name}" created.`);
    },
    [appId, firstAction, refetchActions, reset, router, pathname, setError],
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

            <div className="flex w-full justify-end">
              <DecoratedButton
                variant="primary"
                type="submit"
                disabled={!isValid}
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
