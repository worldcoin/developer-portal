"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import clsx from "clsx";
import { type HTMLAttributes, type ReactNode, useState } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  triggerProps?: HTMLAttributes<HTMLSpanElement> & { tabIndex?: number };
};

export const Tooltip = ({
  content,
  children,
  placement = "top",
  triggerProps,
}: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const { className: triggerClassName, ...otherTriggerProps } =
    triggerProps ?? {};

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context, { toggle: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        ref={refs.setReference}
        className={clsx("inline-flex", triggerClassName)}
        {...getReferenceProps(otherTriggerProps)}
      >
        {children}
      </span>

      {open && content ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={clsx(
              "z-50 max-w-xs rounded-lg border border-grey-200 bg-grey-0 px-3 py-2 text-12 leading-4 text-grey-700 shadow-lg",
            )}
          >
            {content}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};
