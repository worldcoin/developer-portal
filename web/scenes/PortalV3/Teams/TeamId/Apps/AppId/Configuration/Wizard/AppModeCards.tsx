"use client";

import { Link } from "@/components/Link";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

export type AppMode = "mini-app" | "external";

const EcosystemLink = () => (
  <Link href="https://world.org/ecosystem" className="relative z-10 underline">
    ecosystem page
  </Link>
);

const APP_MODES: { value: AppMode; title: string; description: ReactNode }[] = [
  {
    value: "mini-app",
    title: "Mini App",
    description: (
      <>
        Web apps that run inside World App and use MiniKit for native-like
        experiences. Verified Mini Apps can be featured on the <EcosystemLink />{" "}
        and become eligible for the Mini App Store.
      </>
    ),
  },
  {
    value: "external",
    title: "External integration",
    description: (
      <>
        Add World ID to an existing website or app so people can prove they are
        human without sharing personal information. Verified integrations can be
        featured on the <EcosystemLink />, but not in the Mini App Store.
      </>
    ),
  },
];

type AppModeCardsProps = { disabled?: boolean } & (
  | { loading: true; value?: never; onChange?: never }
  | { loading?: false; value: AppMode; onChange: (value: AppMode) => void }
);

/** App-type radio cards choosing between Mini App and external integration. */
export const AppModeCards = (props: AppModeCardsProps) => (
  <div className="flex w-full items-stretch gap-4">
    {APP_MODES.map((mode) => {
      const isSelected = !props.loading && props.value === mode.value;
      const isInteractive = !props.disabled && !props.loading;

      return (
        <label
          key={mode.value}
          className={clsx(
            "flex min-w-0 flex-1 flex-col gap-3 rounded-[10px] border border-portal-border px-6 py-5",
            {
              "opacity-60": props.disabled,
              "cursor-default": !isInteractive,
              "cursor-pointer focus-within:ring-2 focus-within:ring-portal-ink focus-within:ring-offset-2":
                isInteractive,
            },
          )}
        >
          <span className="flex w-full items-center justify-between">
            <span className="text-15 leading-[1.2] font-medium whitespace-nowrap text-portal-ink">
              {mode.title}
            </span>

            {props.loading && (
              <Skeleton
                circle
                width={20}
                height={20}
                containerClassName={clsx(
                  "flex size-5 shrink-0",
                  opticalIconClassName,
                )}
              />
            )}

            {!props.loading && (
              <>
                <input
                  type="radio"
                  name="app-mode"
                  aria-label={mode.title}
                  value={mode.value}
                  checked={isSelected}
                  disabled={props.disabled}
                  onChange={() => props.onChange(mode.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    opticalIconClassName,
                    isSelected
                      ? "bg-portal-ink"
                      : "border-[1.25px] border-portal-border",
                  )}
                >
                  {isSelected && (
                    <Icon name="radio-check" className="size-[13.333px]" />
                  )}
                </span>
              </>
            )}
          </span>

          <span className="text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
            {mode.description}
          </span>
        </label>
      );
    })}
  </div>
);
