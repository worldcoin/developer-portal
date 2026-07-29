"use client";

import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { DialogTitle } from "@headlessui/react";
import type { ReactNode } from "react";

type FormDialogProps = {
  children: ReactNode;
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  title: ReactNode;
};

export const FormDialog = ({
  children,
  closeLabel,
  open,
  onClose,
  title,
}: FormDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} appear>
      <DialogOverlay />

      <DialogPanel className="justify-items-stretch rounded-[14px] border border-black/5 bg-white p-0 shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:w-[440px] md:min-w-0 md:rounded-[14px]">
        <div className="border-b border-portal-border px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="font-world text-18 leading-[1.25] font-medium text-portal-text">
              {title}
            </DialogTitle>

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

        <div className="px-6 py-6">{children}</div>
      </DialogPanel>
    </Dialog>
  );
};
