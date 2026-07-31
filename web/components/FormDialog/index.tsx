"use client";

import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { DialogTitle } from "@headlessui/react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type FormDialogProps = {
  children: ReactNode;
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  // Fires once the 150ms leave transition finishes. Clear any state that
  // drives the dialog's content here, NOT in onClose: the dialog keeps
  // rendering while it fades out, so clearing on close snaps the content
  // back to its initial view mid-animation.
  afterLeave?: () => void;
  // Set false to hold the user in the dialog: Escape and backdrop clicks are
  // ignored and the header close button is disabled. Required for any step
  // whose result cannot be recovered once discarded — an irreversible mutation
  // in flight whose response carries a one-time secret (API key create/rotate).
  // Dismissing such a dialog leaves the old credential already invalidated and
  // the new one never shown. Callers must tie this to the in-flight window only
  // (`dismissable={!loading}`) so a failure hands control back instead of
  // trapping the user, and must disable their own cancel/done buttons over the
  // same window — this covers Escape, the backdrop and the header X, not
  // buttons in the dialog body.
  dismissable?: boolean;
  // Set false when the dialog is lazy-mounted behind a loading overlay that
  // mimics the backdrop: animating the initial mount would restart the
  // backdrop from transparent, visibly un-dimming the page between the
  // overlay unmounting and the fade-in. Subsequent open/close transitions
  // still animate — this only skips the first-mount animation.
  appear?: boolean;
  bodyClassName?: string;
  dialogClassName?: string;
  panelClassName?: string;
};

const ignoreDismiss = () => {};

const actionClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-8 px-4 font-world text-13 leading-none font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed";

const actionVariantClassNames = {
  primary:
    "bg-portal-ink text-white enabled:hover:bg-portal-ink-hover disabled:bg-grey-200 disabled:text-grey-400",
  secondary:
    "border border-grey-200 bg-white text-portal-text enabled:hover:bg-grey-50 disabled:text-grey-300",
  danger:
    "bg-system-error-600 text-white enabled:hover:bg-system-error-500 disabled:bg-grey-200 disabled:text-grey-400",
};

// Plain join, not twMerge: twMerge reads the custom text-13/text-14 size
// utilities as text colors, so a later color class (text-white) silently
// drops the font size.
const joinClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(" ");

type FormDialogButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: keyof typeof actionVariantClassNames;
  // Swaps the label for a spinner and disables the button. The spinner has no
  // text, so callers must keep an aria-label for the accessible name.
  loading?: boolean;
};

export const FormDialogButton = ({
  variant = "primary",
  loading = false,
  type = "button",
  disabled = false,
  className,
  children,
  ...rest
}: FormDialogButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={joinClassNames(
      actionClassName,
      actionVariantClassNames[variant],
      className,
    )}
    {...rest}
  >
    {loading ? <SpinnerIcon className="size-5 animate-spin" /> : children}
  </button>
);

// Two-action footer: render [secondary, primary]. flex-col-reverse stacks the
// primary (last) action on top on mobile; md shows source order side by side.
export const FormDialogFooter = ({
  className,
  ...rest
}: ComponentPropsWithRef<"div">) => (
  <div
    className={joinClassNames(
      "flex w-full flex-col-reverse gap-3 md:grid md:grid-cols-2",
      className,
    )}
    {...rest}
  />
);

export const FormDialogLabel = ({
  className,
  ...rest
}: ComponentPropsWithRef<"label">) => (
  <label
    className={joinClassNames(
      "mb-2 block font-world text-13 leading-none font-medium text-portal-text",
      className,
    )}
    {...rest}
  />
);

export const FormDialogInput = ({
  className,
  ...rest
}: ComponentPropsWithRef<"input">) => (
  <input
    className={joinClassNames(
      "h-11 w-full rounded-8 border border-grey-200 bg-white px-3 font-world text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200 disabled:bg-grey-50 disabled:text-grey-400",
      className,
    )}
    {...rest}
  />
);

export const FormDialogFieldError = ({
  className,
  ...rest
}: ComponentPropsWithRef<"p">) => (
  <p
    className={joinClassNames(
      "mt-2 font-world text-12 leading-[1.4] text-system-error-600",
      className,
    )}
    {...rest}
  />
);

export const FormDialog = ({
  children,
  closeLabel,
  open,
  onClose,
  title,
  afterLeave,
  dismissable = true,
  appear = true,
  bodyClassName,
  dialogClassName,
  panelClassName,
}: FormDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={dismissable ? onClose : ignoreDismiss}
      appear={appear}
      afterLeave={afterLeave}
      className={dialogClassName}
    >
      <DialogOverlay />

      <DialogPanel
        className={twMerge(
          "justify-items-stretch overflow-hidden rounded-[14px] border border-black/5 bg-white p-0 shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:w-[440px] md:min-w-0 md:rounded-[14px]",
          panelClassName,
        )}
      >
        <div className="border-b border-portal-border px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="font-world text-18 leading-[1.25] font-medium text-portal-text">
              {title}
            </DialogTitle>

            <button
              type="button"
              onClick={onClose}
              disabled={!dismissable}
              aria-label={closeLabel}
              className="flex size-8 shrink-0 items-center justify-center rounded-8 text-portal-muted transition-colors hover:bg-portal-border hover:text-portal-text focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-portal-muted"
            >
              <RemoveCustomIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className={twMerge("px-6 py-6", bodyClassName)}>{children}</div>
      </DialogPanel>
    </Dialog>
  );
};
