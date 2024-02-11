"use client";

import { CloseIcon } from "@/components/Icons/CloseIcon";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect } from "react";
import slugify from "slugify";
import { ApolloError } from "@apollo/client";
import { toast } from "react-toastify";
import { generateExternalNullifier } from "@/lib/hashing";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { useInsertActionMutation } from "./graphql/insert-action.generated";
import { MaxVerificationsSelector } from "./MaxVerificationsSelector";
import clsx from "clsx";
import { Link } from "@/components/Link";
import { GetActionsDocument } from "../graphql/client/actions.generated";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { SizingWrapper } from "@/components/SizingWrapper";

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
};

export const CreateActionModal = (props: CreateActionModalProps) => {
  const { className, firstAction } = props;
  const pathname = usePathname() ?? "";
  const params = useParams();
  const router = useRouter();
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(createActionSchema),
    mode: "onChange",
    defaultValues: {
      maxVerifications: 1,
    },
  });
  const [insertActionQuery, { loading }] = useInsertActionMutation({});

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
        const result = await insertActionQuery({
          variables: {
            name: values.name,
            description: values.description,
            action: values.action,
            app_id: appId,
            external_nullifier: generateExternalNullifier(appId, values.action)
              .digest,
            max_verifications: values.maxVerifications,
          },
          context: { headers: { team_id: teamId } },
          refetchQueries: [
            {
              query: GetActionsDocument,
              variables: { app_id: appId },
              context: { headers: { team_id: teamId } },
            },
          ],
          awaitRefetchQueries: true,
        });

        if (result instanceof Error) {
          throw result;
        }
        // TODO: Turn on Posthog
        // posthog.capture("action_created", {
        //   name: values.name,
        //   app_id: currentApp.id,
        //   action_id: values.action,
        // });
        const action_id = result.data?.insert_action_one?.id;
        reset();
        if (firstAction) {
          router.replace(`${pathname}/${action_id}/settings`);
        } else {
          router.prefetch(pathname);
          router.replace(pathname);
        }
      } catch (error) {
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
      insertActionQuery,
      appId,
      teamId,
      reset,
      firstAction,
      router,
      pathname,
      setError,
    ],
  );

  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(watch("action"));
    toast.success("Copied to clipboard");
  }, [watch]);

  return (
    <div
      className={clsx(
        "fixed inset-0 w-full bg-white grid justify-center",
        className,
      )}
    >
      <div className="grid grid-rows-auto/1fr items-center h-[100dvh] w-[100dvw]">
        <SizingWrapper gridClassName="bg-grey-0 z-10 border-b">
          <header className="w-full flex justify-between items-center min-h-9 py-4 border-grey-100">
            <div className="flex gap-3 w-full items-center">
              <Link href={pathname}>
                <CloseIcon />
              </Link>
              <span className="text-grey-200">|</span>
              <Typography className="font-[500]" variant={TYPOGRAPHY.R4}>
                Create an incognito action
              </Typography>
            </div>

            <div className="flex justify-end ">
              <LoggedUserNav />
            </div>
          </header>
        </SizingWrapper>

        <SizingWrapper
          gridClassName="overflow-y-auto no-scrollbar"
          className="flex justify-center items-center"
        >
          <form
            onSubmit={handleSubmit(submit)}
            className="grid grid-cols-1 gap-6 w-full max-w-[580px] py-10"
          >
            <Typography className="mb-2" variant={TYPOGRAPHY.H6}>
              Create an incognito action
            </Typography>
            <Input
              register={register("name")}
              errors={errors.name}
              label="Name"
              placeholder="Anonymous Vote #12"
              required
            />
            <Input
              register={register("description")}
              errors={errors.description}
              label="Short Description"
              placeholder="Cast your vote on proposal #102"
              helperText="Tell your users what the action is about. Shown in the World App."
              required
            />
            <Input
              register={register("action")}
              errors={errors.action}
              label="Identifier"
              helperText="This is the value you will use in IDKit and any API calls."
              placeholder="A short description of your action"
              required
              addOnRight={
                <button className="px-1" type="button" onClick={copyAction}>
                  <CopyIcon />
                </button>
              }
            />
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
                    label="Max verifications per user"
                    helperText="The number of verifications the same person can do for this action"
                  />
                );
              }}
            />

            <div className="w-full flex justify-end">
              <DecoratedButton
                variant="primary"
                type="submit"
                disabled={!isValid || loading}
                className="px-10 py-3"
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
