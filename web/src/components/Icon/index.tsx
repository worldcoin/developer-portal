import cn from "classnames";
import { CSSProperties, memo } from "react";
import styles from "./icon.module.css";

const iconNames = [
  "actions-empty",
  "add",
  "angle-down",
  "api",
  "app-logo",
  "apps-actions",
  "apps",
  "arrow-left",
  "arrow-right",
  "arrow-right2",
  "badge",
  "badge-check",
  "badge-check2",
  "badge-nullifier",
  "badge-verification",
  "book",
  "camera",
  "chart",
  "check",
  "check2",
  "checkbox-on",
  "checkbox",
  "checkmark-selected",
  "checkmark",
  "close",
  "cloud",
  "copy",
  "debugger",
  "delete",
  "document",
  "dots",
  "edit",
  "edit-2",
  "edit-alt",
  "eth",
  "export",
  "external",
  "filter",
  "help",
  "illustration-error",
  "kiosk-qr-mobile",
  "kiosk-qr-page",
  "kiosk-restart-page",
  "kiosk-success-page",
  "kiosk",
  "link",
  "lock",
  "logo",
  "logo-dev",
  "logomark",
  "logout",
  "magnifier",
  "maximize",
  "meter",
  "notepad",
  "octagon",
  "on-chain",
  "plus",
  "public",
  "rocket",
  "search",
  "shield",
  "speed-test",
  "spinner-gradient",
  "spinner",
  "spinner2",
  "stats",
  "success",
  "success-illustration",
  "target",
  "team",
  "user",
  "user-add",
  "user-solid",
  "verified",
  "warning",
  "warning-error",
  "warning-illustration",
  "warning-triangle",
  "window",
  "world-id-sign-in",
  "world-id-sign-in-disabled",
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
        path?: string;
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
