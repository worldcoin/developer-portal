import clsx from "clsx";
import { ReactNode } from "react";

type ModalIconVariant = "error" | "info" | "neutral";

type ModalIconProps = {
  variant: ModalIconVariant;
  children: ReactNode;
};

const variantStyles: Record<ModalIconVariant, string> = {
  error: "bg-system-error-500",
  info: "bg-additional-blue-600",
  neutral: "bg-grey-400",
};

export const ModalIcon = ({ variant, children }: ModalIconProps) => {
  return (
    <div
      className={clsx(
        "flex size-20 items-center justify-center rounded-full",
        variantStyles[variant],
      )}
    >
      {children}
    </div>
  );
};
