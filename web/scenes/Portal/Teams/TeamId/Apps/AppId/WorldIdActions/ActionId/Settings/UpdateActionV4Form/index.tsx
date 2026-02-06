"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { ToggleSection } from "@/components/ToggleSection";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  CreateActionSchemaV4,
  createActionSchemaV4,
} from "../../../page/CreateActionDialogV4/server/form-schema-v4";
import { GetSingleActionV4Query } from "../../page/graphql/client/get-single-action-v4.generated";
import { updateActionV4ServerSide } from "./server";

type UpdateActionV4FormProps = {
  action: NonNullable<GetSingleActionV4Query["action_v4_by_pk"]>;
  appId: string;
};

export const UpdateActionV4Form = (props: UpdateActionV4FormProps) => {
  const { action, appId } = props;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    reset,
    watch,
  } = useForm<CreateActionSchemaV4>({
    resolver: yupResolver(createActionSchemaV4),
    mode: "onChange",
    defaultValues: {
      action: action.action,
      description: action.description || "",
      environment:
        action.environment === "staging" || action.environment === "production"
          ? action.environment
          : "staging",
    },
  });

  const submit = useCallback(
    async (values: CreateActionSchemaV4) => {
      setIsSubmitting(true);
      const result = await updateActionV4ServerSide(values, action.id, appId);
      setIsSubmitting(false);

      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        reset(values);
        router.refresh(); // Trigger server component re-render to update environment badge
      }
    },
    [action.id, appId, reset, router],
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="grid w-full gap-y-6">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Settings
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Configure your action identifier, description, and environment.
        </Typography>
      </div>

      <div className="grid gap-y-4">
        {/* Identifier (Read-only) */}
        <div className="grid gap-y-2">
          <Input
            register={register("action")}
            disabled={true}
            label="Identifier"
            errors={errors.action}
            addOnRight={
              <CopyButton
                fieldName="Action identifier"
                fieldValue={watch("action")}
              />
            }
            required
          />
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            This is the value you will use in IDKit and any API calls
          </Typography>
        </div>

        {/* Description */}
        <Input
          register={register("description")}
          errors={errors.description}
          label="Short description"
          placeholder="e.g., Vote in community polls"
        />

        {/* Environment Toggle using ToggleSection */}
        <Controller
          name="environment"
          control={control}
          render={({ field }) => (
            <ToggleSection
              title="Staging"
              description="Staging actions are for development only and allow the same user to verify multiple times."
              checked={field.value === "staging"}
              onChange={(checked) =>
                field.onChange(checked ? "staging" : "production")
              }
            />
          )}
        />
      </div>

      <div className="flex justify-start">
        <DecoratedButton
          type="submit"
          variant="primary"
          disabled={isSubmitting || !isValid}
          className="px-8 py-3"
        >
          <Typography variant={TYPOGRAPHY.R3}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Typography>
        </DecoratedButton>
      </div>
    </form>
  );
};
