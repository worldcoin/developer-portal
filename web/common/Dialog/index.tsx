import { memo, ReactNode } from "react";
import cn from "classnames";
import { Dialog as BaseDialog } from "@headlessui/react";
import { Icon } from "common/Icon";

interface DialogProps {
  className?: string;
  panelClassName?: string;
  children: ReactNode;
  open?: boolean;
  onClose: () => void;
}

export const Dialog = memo(function Dialog(props: DialogProps) {
  return (
    <BaseDialog
      className={cn(props.className)}
      open={props.open}
      onClose={props.onClose}
    >
      <div className="fixed inset-0 bg-neutral-primary/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <BaseDialog.Panel
          className={cn(
            props.panelClassName,
            "relative w-[448px] px-8 py-12 bg-ffffff rounded-xl"
          )}
        >
          <button
            className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full bg-ebecef"
            onClick={props.onClose}
          >
            <Icon className="w-6 h-6 text-neutral-primary" name="close" />
          </button>
          {props.children}
        </BaseDialog.Panel>
      </div>
    </BaseDialog>
  );
});
