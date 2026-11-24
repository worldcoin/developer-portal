import clsx from "clsx";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type SettingsPanelProps = ComponentProps<"section"> & {
  tone?: "default" | "danger";
};

export const SettingsPanel = (props: SettingsPanelProps) => {
  const { className, tone = "default", ...otherProps } = props;

  return (
    <section
      className={twMerge(
        clsx(
          "flex h-full min-w-0 flex-col overflow-hidden rounded-16 border bg-surface shadow-portal-card",
          {
            "border-portal-border": tone === "default",
            "border-edge-error-200": tone === "danger",
          },
          className,
        ),
      )}
      {...otherProps}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  const { className, ...otherProps } = props;

  return <header className={twMerge("px-5 py-5", className)} {...otherProps} />;
};

const Title = (props: ComponentProps<"h2">) => {
  const { className, ...otherProps } = props;

  return (
    <h2
      className={twMerge(
        "font-twk text-17 leading-6 font-[550] text-content-primary",
        className,
      )}
      {...otherProps}
    />
  );
};

const Body = (props: ComponentProps<"div">) => {
  const { className, ...otherProps } = props;

  return <div className={twMerge("min-w-0", className)} {...otherProps} />;
};

const Footer = (props: ComponentProps<"footer">) => {
  const { className, ...otherProps } = props;

  return (
    <footer
      className={twMerge(
        "mt-auto flex min-h-14 items-center justify-between gap-3 border-t border-edge-subtle bg-surface-faint px-5 py-3",
        className,
      )}
      {...otherProps}
    />
  );
};

SettingsPanel.Header = Header;
SettingsPanel.Title = Title;
SettingsPanel.Body = Body;
SettingsPanel.Footer = Footer;
