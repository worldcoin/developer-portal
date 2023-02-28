import { Icon } from "common/Icon";
import { apps } from "common/Layout/temp-data";
import { Switch } from "common/Switch";
import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";
import cn from "classnames";
import { useAppsStore } from "stores/app-store";

export const AppHeader = memo(function AppHeader(props: {
  app: (typeof apps)[0];
}) {
  const [copied, setCopied] = useState(false);
  const toggleAppActivity = useAppsStore((state) => state.toggleAppActivity);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <section className="grid gap-y-8">
      <div className="grid gap-x-6 grid-cols-auto/1fr grid-rows-2">
        <div className="relative p-3.5 border border-f3f4f5 rounded-full row-span-2">
          <Image
            src={props.app.logo_url}
            alt="app logo"
            width={44}
            height={44}
          />

          {props.app.is_verified && (
            <Icon
              name="badge"
              className="absolute bottom-0 right-1 h-4 w-4"
              noMask
            />
          )}
        </div>

        <h1 className="text-20 font-sora font-semibold self-end">
          {props.app.name}
        </h1>
        <span className="text-14 text-657080 truncate self-start">
          {props.app.description_internal}
        </span>
      </div>

      <div className="border-y border-f3f4f5 py-4 flex flex-wrap gap-y-4 justify-between">
        <div className="grid lg:grid-flow-col justify-start gap-y-2 gap-x-12">
          <div className="grid items-center gap-x-1 grid-flow-col justify-start text-14">
            <span className="mr-1 text-neutral-secondary">App ID:</span>
            <span>{props.app.id}</span>

            <button
              className="outline-none hover:opacity-80 transition-opacity text-0"
              onClick={() => setCopied(true)}
            >
              {!copied && <Icon name="copy" className="h-4 w-4 text-primary" />}

              {copied && <Icon name="check" className="h-4 w-4 text-primary" />}
            </button>
          </div>

          <div className="grid grid-cols-auto/1fr gap-x-2 items-center">
            <Icon
              name={props.app.is_staging ? "api" : "rocket"}
              className="w-4 h-4"
            />
            <span>{props.app.is_staging ? "Staging" : "Production"}</span>
          </div>

          <div className="grid grid-cols-auto/1fr gap-x-2 items-center">
            <Icon
              name={props.app.engine === "cloud" ? "cloud" : "on-chain"}
              className="w-4 h-4"
            />
            <span>{props.app.engine === "cloud" ? "Cloud" : "On-Chain"}</span>
          </div>
        </div>

        <div className="ml-auto grid gap-x-6 grid-flow-col items-center">
          <div
            className={cn(
              "grid grid-cols-auto/1fr items-center gap-x-1 px-2 py-1 rounded-full",
              { "bg-primary-light": props.app.status === "active" },
              { "bg-warning-light": props.app.status === "inactive" }
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                { "bg-primary": props.app.status === "active" },
                { "bg-warning": props.app.status === "inactive" }
              )}
            />

            <span
              className={cn(
                "first-letter:capitalize",
                { "text-primary": props.app.status === "active" },
                { "text-warning": props.app.status === "inactive" }
              )}
            >
              {props.app.status}
            </span>
          </div>

          <Switch checked={props.app.is_verified} toggle={toggleAppActivity} />
        </div>
      </div>
    </section>
  );
});
