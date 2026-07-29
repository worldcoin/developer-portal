"use client";

import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { useId } from "react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type FormDialogProps = {
  children: ReactNode;
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  bodyClassName?: string;
  dialogClassName?: string;
  panelClassName?: string;
};

const actionClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-8 px-4 font-world text-13 leading-none font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed";

export const formDialogPrimaryActionClassName = `${actionClassName} bg-portal-ink text-white enabled:hover:bg-portal-ink-hover disabled:bg-grey-200 disabled:text-grey-400`;
export const formDialogSecondaryActionClassName = `${actionClassName} border border-grey-200 bg-white text-portal-text enabled:hover:bg-grey-50 disabled:text-grey-300`;
export const formDialogDangerActionClassName = `${actionClassName} bg-system-error-600 text-white enabled:hover:bg-system-error-500 disabled:bg-grey-200 disabled:text-grey-400`;
export const formDialogLabelClassName =
  "mb-2 block font-world text-13 leading-none font-medium text-portal-text";
export const formDialogInputClassName =
  "h-11 w-full rounded-8 border border-grey-200 bg-white px-3 font-world text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200 disabled:bg-grey-50 disabled:text-grey-400";
export const formDialogErrorClassName =
  "mt-2 font-world text-12 leading-[1.4] text-system-error-600";

export const FormDialog = ({
  children,
  closeLabel,
  open,
  onClose,
  title,
  bodyClassName,
  dialogClassName,
  panelClassName,
}: FormDialogProps) => {
  const titleId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      appear
      className={dialogClassName}
      aria-labelledby={titleId}
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
            <h2
              id={titleId}
              className="font-world text-18 leading-[1.25] font-medium text-portal-text"
            >
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex size-8 shrink-0 items-center justify-center rounded-8 text-portal-muted transition-colors hover:bg-portal-border hover:text-portal-text focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:outline-hidden"
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
