"use client";

import { CloseIcon } from "@/components/Icons/CloseIcon";
import { UserHelpNav } from "@/components/UserHelpNav";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect } from "react";
import slugify from "slugify";
import { ApolloError } from "@apollo/client";
import { toast } from "react-toastify";
import { useInsertActionMutation } from "../CreateActionModal/graphql/insert-action.generated";
import { generateExternalNullifier } from "@/legacy/lib/hashing";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { MaxVerificationsSelector } from "./maxVerifications";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { ApolloQueryResult } from "@apollo/client";
import { ActionsQuery } from "../graphql/server/actions.generated";

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
  refetchActions: () => Promise<ApolloQueryResult<ActionsQuery>>;
};

export const CreateActionModal = (props: CreateActionModalProps) => {
  const { refetchActions } = props;
  const pathname = usePathname() ?? "";
  const params = useParams();
  const appId = params?.appId as `app_${string}`;

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    setError,
    watch,
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(createActionSchema),
    mode: "onChange",
    defaultValues: {
      maxVerifications: 1,
    },
  });
  const [insertActionQuery, { loading }] = useInsertActionMutation({});
  const router = useRouter();

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
        refetchActions();
        router.push(pathname);
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
            "An action with this identifier already exists for this app. Please change the 'action' identifier."
          );
        }
        return toast.error("Error occurred while creating action.");
      }
      toast.success(`Action "${values.name}" created.`);
    },
    [appId, insertActionQuery, pathname, refetchActions, router, setError]
  );
  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(watch("action"));
    toast.success("Copied to clipboard");
  }, [watch]);
  return (
    <div className="fixed inset-0 w-full bg-white flex justify-center py-10 overflow-auto ">
      <div className="absolute top-0 w-full px-24 py-5 grid grid-cols-2 border-b-[1px] border-grey-100 bg-white">
        <div className="grid grid-cols-[auto_auto_1fr] gap-3 w-full items-center">
          <Link href={pathname}>
            <CloseIcon />
          </Link>
          <div className="border-r-[1px] border-gray-200 h-full"></div>
          <p className="font-[500] text-sm">Create an incognito action</p>
        </div>
        <div className="flex justify-end ">
          <UserHelpNav />
        </div>
      </div>
      <div className="w-screen p-10 overflow-auto grid items-center justify-center min-h-full">
        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 gap-6"
        >
          <h1 className="text-2xl font-[550] mb-2">
            Create an incognito action
          </h1>
          <Input
            register={register("name")}
            errors={errors.name}
            label="Name"
            placeholder="Anonymous Vote #12"
            required
            className="w-inputLarge"
          />
          <Input
            register={register("description")}
            errors={errors.description}
            label="Short Description"
            placeholder="Cast your vote on proposal #102"
            helperText="Tell your users what the action is about. Shown in the World App."
            required
            className="w-inputLarge"
          />
          <Input
            register={register("action")}
            errors={errors.action}
            label="Identifier"
            helperText="This is the value you will use in IDKit and any API calls."
            placeholder="A short description of your action"
            required
            addOnPosition="right"
            addOn={
              <button className="px-1" type="button" onClick={copyAction}>
                <CopyIcon />
              </button>
            }
            className="w-inputLarge"
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
                  className="w-inputLarge" // border is 2px
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
              Create Action
            </DecoratedButton>
          </div>
        </form>
      </div>
    </div>
  );
};
