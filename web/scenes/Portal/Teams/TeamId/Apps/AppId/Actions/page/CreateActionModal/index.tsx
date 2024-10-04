"use client";

import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { generateExternalNullifier } from "@/lib/hashing";
import { EngineType } from "@/lib/types";
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
import { useInsertActionMutation } from "./graphql/client/insert-action.generated";

const createActionSchema = yup.object({
  name: yup.string().required("This field is required"),
  description: yup.string().required(),
  action: yup.string().required("This field is required"),
  maxVerifications: yup
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
      maxVerifications: 1,
    },
  });

  const [insertActionMutation, { loading }] = useInsertActionMutation({});

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

  const submit = useCallback(
    async (values: NewActionFormValues) => {
      try {
        const result = await insertActionMutation({
          variables: {
            name: values.name,
            description: values.description,
            action: values.action,
            app_id: appId,
            external_nullifier: generateExternalNullifier(appId, values.action)
              .digest,
            max_verifications: values.maxVerifications,
          },

          refetchQueries: [GetActionsDocument],
          awaitRefetchQueries: true,
        });

        if (result instanceof Error) {
          throw result;
        }
        const action_id = result.data?.insert_action_one?.id;

        posthog.capture("action_created", {
          name: values.name,
          app_id: appId,
          action_id: action_id,
          is_first_action: firstAction,
        });

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
    [
      insertActionMutation,
      appId,
      reset,
      firstAction,
      router,
      pathname,
      setError,
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
                disabled={!isValid || loading}
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
