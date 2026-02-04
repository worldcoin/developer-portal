"use client";

import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { ToggleSection } from "@/components/ToggleSection";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { validateAndInsertActionV4 } from "./server";
import {
  createActionSchemaV4,
  CreateActionSchemaV4,
} from "./server/form-schema-v4";

type CreateActionDialogV4Props = {
  open: boolean;
  onClose: (success?: boolean) => void;
};

export const CreateActionDialogV4 = (props: CreateActionDialogV4Props) => {
  const { open, onClose } = props;
  const params = useParams();
  const appId = params?.appId as `app_${string}`;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid },
    handleSubmit,
    setValue,
    watch,
  } = useForm<CreateActionSchemaV4>({
    resolver: yupResolver(createActionSchemaV4),
    mode: "onChange",
    defaultValues: {
      action: "",
      description: "",
      environment: "production",
    },
  });

  const submit = useCallback(
    async (values: CreateActionSchemaV4) => {
      setIsSubmitting(true);

      const result = await validateAndInsertActionV4(values, appId);

      if (!result.success) {
        toast.error(result.message);
        // Dialog stays open - user can fix and retry
      } else {
        toast.success(`Action "${values.action}" created.`);
        onClose(true);
      }

      setIsSubmitting(false);
    },
    [appId, onClose],
  );

  // Auto-transform identifier: lowercase and replace spaces/underscores with dashes
  const transformIdentifier = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[\s_]+/g, "-") // Replace spaces and underscores with dashes
      .replace(/[^a-z0-9-]/g, "") // Remove other invalid chars
      .replace(/-{2,}/g, "-") // Collapse multiple consecutive dashes
      .slice(0, 32); // Limit to 32 chars
>>>>>>> 6540aa43 (fix: allow typing dashes in action identifier input)
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-10 grid w-full justify-center bg-white">
      <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr">
        <header className="max-h-[56px] w-full border-b border-grey-100 py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button
                  type="button"
                  onClick={() => onClose()}
                  className="flex"
                >
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  Create new action
                </Typography>
              </div>
              <LoggedUserNav />
            </div>
          </SizingWrapper>
        </header>

        <SizingWrapper
          gridClassName="overflow-y-auto no-scrollbar"
          className="py-10"
        >
          <form
            onSubmit={handleSubmit(submit)}
            className="mx-auto grid w-full max-w-[580px] grid-cols-1 gap-6"
          >
            <Typography className="mb-2" variant={TYPOGRAPHY.H6}>
              Create new action
            </Typography>

            <Controller
              name="action"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(e) => {
                    const transformed = transformIdentifier(e.target.value);
                    field.onChange(transformed);
                  }}
                  value={field.value}
                  errors={errors.action}
                  label="Identifier"
                  placeholder="proposal-102"
                  helperText="This is the value you will use in IDKit and any API calls. Max 32 characters."
                  data-testid="input-action"
                  required
                  addOnRight={
                    <CopyButton
                      fieldName="Action identifier"
                      fieldValue={watch("action")}
                    />
                  }
                />
              )}
            />

            <Input
              register={register("description")}
              errors={errors.description}
              label="Short Description"
              placeholder="Cast your vote on proposal #102"
              data-testid="input-description"
            />

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

            <div className="flex w-full justify-end">
              <DecoratedButton
                variant="primary"
                type="submit"
                disabled={!isValid || isSubmitting}
                className="px-10 py-3"
                testId="create-action-v4"
              >
                <Typography variant={TYPOGRAPHY.R3}>Create action</Typography>
              </DecoratedButton>
            </div>
          </form>
        </SizingWrapper>
      </div>
    </div>
  );
};
