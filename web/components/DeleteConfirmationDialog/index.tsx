"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { FloatingInput } from "@/components/FloatingInput";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { ModalIcon } from "@/components/ModalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
  title: ReactNode;
  description: ReactNode;
  // The word the user must type to unlock the confirm button, matched
  // case-insensitively. Set it for anything whose data is gone for good; leave
  // it off for confirmations the user can walk back (leaving a team, removing a
  // member who can be re-invited).
  confirmationWord?: string;
  // Disables both buttons while the caller's mutation is in flight.
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
    // Clear the verification word once the dialog is fully gone: this component
    // outlives the input, so a reopened dialog would otherwise arrive with the
    // word still typed and the confirm button already unlocked. Resetting after
    // the leave transition keeps the field from blanking mid-animation.
    <Dialog open={open} onClose={onClose} afterLeave={() => reset()}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-6 md:max-w-xl">
        <ModalIcon variant="error">
          <AlertIcon className="size-7 text-white" />
        </ModalIcon>

        <div className="grid w-full place-items-center gap-y-5">
          <Typography
            as="h3"
            variant={TYPOGRAPHY.H6}
            className="text-center text-grey-900"
          >
            {title}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            {description}
          </Typography>
        </div>

        <form
          className="grid w-full gap-y-7"
          onSubmit={
            confirmationWord
              ? handleSubmit(() => onConfirm())
              : (event) => {
                  event.preventDefault();
                  onConfirm();
                }
          }
        >
          {confirmationWord && (
            <FloatingInput
              id={inputId}
              register={register("confirmation")}
              label={
                <>
                  To verify, type{" "}
                  <span className="font-medium text-grey-900">
                    {confirmationWord}
                  </span>{" "}
                  below
                </>
              }
              errors={errors.confirmation}
              autoComplete="off"
              autoFocus
            />
          )}

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              className="w-full py-3"
              onClick={onClose}
              disabled={loading}
            >
              <Typography variant={TYPOGRAPHY.R3}>No</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              variant="destructive"
              className="w-full py-3"
              disabled={(Boolean(confirmationWord) && !isValid) || loading}
              loading={loading}
            >
              <Typography variant={TYPOGRAPHY.R3}>Yes</Typography>
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
