"use client";

import { Tooltip } from "@/components/Tooltip";
import clsx from "clsx";
import { type ReactNode } from "react";

export type ActionRestriction = {
  allowed: boolean;
  message: string;
};

type RestrictedActionRenderState = {
  disabled: boolean;
};

type RestrictedActionProps = {
  restriction: ActionRestriction;
  children: ReactNode | ((state: RestrictedActionRenderState) => ReactNode);
  className?: string;
};

export const RestrictedAction = ({
  restriction,
  children,
  className,
}: RestrictedActionProps) => {
  const state = {
    disabled: !restriction.allowed,
  };
  const content = typeof children === "function" ? children(state) : children;

  if (restriction.allowed) {
    return <>{content}</>;
  }

  return (
    <Tooltip
      content={restriction.message}
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
