import { CSSProperties, memo } from "react";
import cn from "classnames";
import styles from "./icon.module.css";

const iconNames = [
  "action-not-found",
  "actions-empty",
  "angle-down",
  "api",
  "app-logo",
  "apps-actions",
  "apps",
  "arrow-left",
  "arrow-right",
  "badge",
  "badge-check",
  "badge-nullifier",
  "badge-verification",
  "chart",
  "check",
  "checkbox-on",
  "checkbox",
  "checkmark-selected",
  "checkmark",
  "close",
  "cloud",
  "copy",
  "debugger",
  "document",
  "dots",
  "edit",
  "edit-alt",
  "envelope",
  "eth",
  "export",
  "external",
  "eye-disable",
  "eye",
  "help",
  "illustration-error",
  "kiosk-qr-mobile",
  "kiosk-qr-page",
  "kiosk-restart-page",
  "kiosk-success-page",
  "kiosk",
  "lock",
  "logo",
  "logout",
  "magnifier",
  "meter",
  "notepad",
  "octagon",
  "on-chain",
  "overview-1",
  "overview-2",
  "overview-3",
  "overview-4",
  "overview-backend",
  "overview-contract",
  "overview-js",
  "overview-proof",
  "overview-qr",
  "overview-request",
  "overview-response",
  "overview-signature",
  "plus",
  "public",
  "rocket",
  "search",
  "shield",
  "speed-test",
  "spinner-gradient",
  "spinner",
  "success",
  "success-illustration",
  "target",
  "team",
  "user",
  "user-solid",
  "warning",
  "warning-triangle",
  "window",
  "wld-logo",
  "wld-sign-in",
  "world-id-sign-in",
  "worldcoin",
  "withdraw",
] as const;

export type IconType = (typeof iconNames)[number];

export const Icon = memo(function Icon(
  props: {
    className?: string;
    noMask?: boolean;
    testId?: string;
  } & (
    | {
        name: IconType;
        path?: never;
      }
    | {
        name?: never;
        path: string;
      }
  )
) {
  return (
    <span
      className={cn(
        styles.icon,
        "inline-block pointer-events-none",

        {
          "bg-current": !props.noMask,
          "no-mask": props.noMask,
        },

        props.className
      )}
      {...(props.testId && { "data-testid": props.testId })}
      role="icon"
      style={
        {
          "--image": `url("${props.path ?? `/icons/${props.name}.svg`}")`,
        } as CSSProperties
      }
    />
  );
});
