"use client";

import { CopyButton } from "@/components/CopyButton";
import {
  FormDialog,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "next/navigation";
import { useCallback } from "react";
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

/** Auto-transform identifier: lowercase, spaces/underscores → dashes. */
const transformIdentifier = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 32);

export const CreateActionDialogV4 = (props: CreateActionDialogV4Props) => {
  const { open, onClose } = props;
  const params = useParams();
  const appId = params?.appId as `app_${string}`;

  const {
    control,
    register,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<CreateActionSchemaV4>({
    resolver: yupResolver(createActionSchemaV4),
    mode: "onChange",
    defaultValues: {
      action: "",
      description: "",
    },
  });

  const actionValue = watch("action");

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Clear fields after the leave transition so content doesn't snap mid-fade.
  const afterLeave = useCallback(() => {
    reset();
  }, [reset]);

  const submit = useCallback(
    async (values: CreateActionSchemaV4) => {
      const result = await validateAndInsertActionV4(values, appId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(`Action "${values.action}" created.`);
      onClose(true);
    },
    [appId, onClose],
  );

  return (
    <FormDialog
      open={open}
      onClose={close}
      afterLeave={afterLeave}
      dismissable={!isSubmitting}
      title="Create new action"
      closeLabel="Close create action dialog"
    >
      <form className="grid w-full gap-y-6" onSubmit={handleSubmit(submit)}>
        <p className="font-world text-14 leading-[1.5] text-portal-muted">
          This identifier is the value you will use in IDKit and any API calls.
        </p>

        <Controller
          name="action"
          control={control}
          render={({ field }) => (
            <div>
              <label
                htmlFor="create-action-identifier"
                className={formDialogLabelClassName}
              >
                Identifier <span aria-hidden="true">*</span>
              </label>

              <div className="relative">
                <input
                  id="create-action-identifier"
                  {...field}
                  onChange={(event) => {
                    field.onChange(transformIdentifier(event.target.value));
                  }}
                  className={`${formDialogInputClassName} pr-12`}
                  placeholder="proposal-102"
                  data-testid="input-action"
                  aria-invalid={Boolean(errors.action)}
                  aria-describedby={
                    errors.action
                      ? "create-action-identifier-error"
                      : "create-action-identifier-hint"
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <CopyButton
                    fieldName="Action identifier"
                    fieldValue={actionValue}
                    className="pr-3"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4">
                {errors.action?.message ? (
                  <p
                    id="create-action-identifier-error"
                    className={formDialogErrorClassName}
                  >
                    {errors.action.message}
                  </p>
                ) : (
                  <p
                    id="create-action-identifier-hint"
                    className="font-world text-12 leading-[1.4] text-portal-muted"
                  >
                    Lowercase letters, numbers, and dashes.
                  </p>
                )}
                <span className="shrink-0 font-world text-12 text-portal-muted">
                  {actionValue.length}/32
                </span>
              </div>
            </div>
          )}
        />

        <div>
          <label
            htmlFor="create-action-description"
            className={formDialogLabelClassName}
          >
            Short description
          </label>
          <input
            id="create-action-description"
            {...register("description")}
            className={formDialogInputClassName}
            placeholder="Cast your vote on proposal #102"
            data-testid="input-description"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "create-action-description-error" : undefined
            }
          />
          {errors.description?.message && (
            <p
              id="create-action-description-error"
              className={formDialogErrorClassName}
            >
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={close}
            disabled={isSubmitting}
            className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            data-testid="create-action-v4"
            aria-label="Create action"
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            {isSubmitting ? (
              <SpinnerIcon className="size-5 animate-spin" />
            ) : (
              "Create action"
            )}
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
