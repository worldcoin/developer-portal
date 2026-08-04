import { ModalIcon } from "@/components/ModalIcon";
import { ReactNode } from "react";

/**
 * Full-height empty/error state for a Mini App subtab: the 88px ModalIcon the
 * delete confirmations use, then the tab's own page type ramp. Transactions had
 * an empty state on a bespoke 64px circle and an error state on a soft ring,
 * with two different heading fonts between them.
 */
export const MiniAppMessageState = (props: {
  variant: "error" | "neutral";
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center">
    <div className="grid max-w-md justify-items-center gap-y-6">
      <ModalIcon variant={props.variant}>{props.icon}</ModalIcon>

      <div className="grid w-full place-items-center gap-y-5">
        <h2 className="text-center font-world text-[26px] leading-[120%] font-semibold tracking-[-0.01em] text-grey-900">
          {props.title}
        </h2>

        <p className="text-center font-world text-[15px] leading-[130%] font-medium text-grey-500">
          {props.description}
        </p>
      </div>

      {props.action}
    </div>
  </div>
);
