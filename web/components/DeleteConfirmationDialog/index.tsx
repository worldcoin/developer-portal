"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { yupResolver } from "@hookform/resolvers/yup";
import { ReactNode, useId } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

type DeleteConfirmationDialogProps = {
  open: boolean;
  // Cancel or dismiss. Confirming does not call this — the caller decides
  // whether the dialog closes before, during or after its own mutation.
  onClose: () => void;
  onConfirm: () => void | Promise<unknown>;
  // Header bar text, so keep it to the action itself ("Delete app"). The
  // consequence belongs in `description`.
  title: string;
  description: ReactNode;
  // The word the user must type to unlock the confirm button, matched
  // case-insensitively. Set it for anything whose data is gone for good; leave
  // it off for confirmations the user can walk back (leaving a team, removing a
  // member who can be re-invited).
  confirmationWord?: string;
  // Disables both buttons and locks Escape/backdrop/X while the caller's
  // mutation is in flight.
  loading?: boolean;
};

const confirmationSchema = (word: string) =>
  yup
    .object({
      confirmation: yup
        .string()
        .matches(
          // Anchored and escaped: the word is a literal, not a pattern.
          new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          "Please check if the input is correct",
        )
        .required("This field is required"),
    })
    .noUnknown();

/**
 * The one confirmation dialog for destructive actions. Every delete in the
 * portal renders through here so the icon, copy shape, verification step and
 * No/Yes ordering cannot drift apart per screen.
 */
export const DeleteConfirmationDialog = (
  props: DeleteConfirmationDialogProps,
) => {
  const {
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmationWord,
    loading,
  } = props;

  const inputId = useId();
  const errorId = `${inputId}-error`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<{ confirmation: string }>({
    resolver: yupResolver(confirmationSchema(confirmationWord ?? "")),
    mode: "onChange",
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      // Clear the verification word once the dialog is fully gone: this
      // component outlives the input, so a reopened dialog would otherwise
      // arrive with the word still typed and the confirm button already
      // unlocked.
      afterLeave={() => reset()}
      // The mutation is already irreversible by the time it is in flight, so
      // hold the user here rather than letting Escape drop them onto a page
      // that has not caught up yet.
      dismissable={!loading}
      title={title}
      closeLabel={`Close ${title.toLowerCase()} dialog`}
    >
      <form
        className="grid w-full gap-y-6"
        onSubmit={
          confirmationWord
            ? handleSubmit(() => onConfirm())
            : (event) => {
                event.preventDefault();
                onConfirm();
              }
        }
      >
        <div className="grid justify-items-center gap-y-4">
          <CircleIconContainer variant="error">
            <AlertIcon />
          </CircleIconContainer>

          <p className="text-center font-world text-14 leading-[1.5] text-portal-muted">
            {description}
          </p>

          {confirmationWord && (
            <div className="flex items-center gap-x-2 rounded-8 bg-system-error-50 px-3 py-2 text-system-error-600">
              <AlertIcon className="size-4 shrink-0" />

              <span className="font-world text-13 leading-none font-medium">
                This action cannot be undone.
              </span>
            </div>
          )}
        </div>

        {confirmationWord && (
          <div>
            <label htmlFor={inputId} className={formDialogLabelClassName}>
              To verify, type {confirmationWord} below
            </label>

            <input
              id={inputId}
              {...register("confirmation")}
              className={formDialogInputClassName}
              aria-invalid={Boolean(errors.confirmation)}
              aria-describedby={errors.confirmation ? errorId : undefined}
              autoComplete="off"
              autoFocus
            />

            {errors.confirmation?.message ? (
              <p id={errorId} className={formDialogErrorClassName}>
                {errors.confirmation.message}
              </p>
            ) : null}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={formDialogSecondaryActionClassName}
          >
            No
          </button>

          <button
            type="submit"
            disabled={(Boolean(confirmationWord) && !isValid) || loading}
            className={formDialogDangerActionClassName}
          >
            Yes
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
