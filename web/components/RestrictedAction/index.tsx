"use client";

import { type ReactNode } from "react";
import clsx from "clsx";
import { Tooltip } from "@/components/Tooltip";

export type ActionRestriction = {
  allowed: boolean;
  message: string;
};

type RestrictedActionRenderState = {
  allowed: boolean;
  disabled: boolean;
};

type RestrictedActionProps = {
  restriction: ActionRestriction;
  children: ReactNode | ((state: RestrictedActionRenderState) => ReactNode);
  className?: string;
  placement?: "top" | "bottom" | "left" | "right";
};

export const RestrictedAction = ({
  restriction,
  children,
  className,
  placement,
}: RestrictedActionProps) => {
  const state = {
    allowed: restriction.allowed,
    disabled: !restriction.allowed,
  };
  const content = typeof children === "function" ? children(state) : children;

  if (restriction.allowed) {
    return <>{content}</>;
  }

  return (
    <Tooltip
      content={restriction.message}
      placement={placement}
      triggerProps={{
        "aria-disabled": true,
        tabIndex: 0,
        className: clsx("cursor-not-allowed", className),
      }}
    >
      <span className="pointer-events-none inline-flex w-full" inert>
        {content}
      </span>
    </Tooltip>
  );
};
