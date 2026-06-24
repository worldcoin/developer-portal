"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import {
  type ActionRestriction,
  RestrictedAction,
} from "@/components/RestrictedAction";
import { type ComponentProps } from "react";

type RestrictedButtonProps = ComponentProps<typeof DecoratedButton> & {
  restriction: ActionRestriction;
};

export const RestrictedButton = ({
  restriction,
  ...buttonProps
}: RestrictedButtonProps) => (
  <RestrictedAction restriction={restriction}>
    {({ disabled: restricted }) => (
      <DecoratedButton
        {...buttonProps}
        disabled={restricted || buttonProps.disabled}
      />
    )}
  </RestrictedAction>
);
