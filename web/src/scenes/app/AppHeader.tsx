import { Icon } from "src/components/Icon";
import { Switch } from "src/components/Switch";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import cn from "classnames";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";

export const AppHeader = memo(function AppHeader() {
  const currentApp = useAppStore((store) => store.currentApp);
  const [copied, setCopied] = useState(false);

  const [image, setImage] = useState<string | null>(
    currentApp?.logo_url ?? null
  );
  const { toggleAppActivity } = useApps();

  useEffect(() => {
    if (copied) {
      navigator.clipboard.writeText(currentApp?.id ?? "");
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied, currentApp?.id]);

  return (
    <section className="grid gap-y-8">
      <div className="grid items-center gap-x-6 grid-cols-auto/1fr grid-rows-2">
        <div className="grid relative p-3.5 border border-f3f4f5 rounded-full row-span-2">
          <div>
            {image && (
              <Image
                src={currentApp?.logo_url ?? ""}
                alt="app logo"
                width={44}
                height={44}
                onError={() => setImage(null)}
              />
            )}

            {!image && (
              <div className="w-11 h-11 rounded-full bg-primary-light flex justify-center items-center">
                <span className="text-primary">{currentApp?.name[0]}</span>
              </div>
            )}
          </div>

          {currentApp?.is_verified && (
            <Icon
              name="badge"
              className="absolute bottom-0 right-1 h-4 w-4"
              noMask
            />
          )}
        </div>

        <h1 className="text-20 font-sora font-semibold self-end">
          {currentApp?.name}
        </h1>
        <span className="text-14 text-657080 truncate self-start">
          {currentApp?.description_internal}
        </span>
      </div>

      <div className="border-y border-f3f4f5 py-4 flex flex-wrap gap-y-4 justify-between">
        <div className="grid lg:grid-flow-col justify-start gap-y-2 gap-x-12">
          <div className="grid items-center gap-x-1 grid-flow-col justify-start text-14">
            <span className="mr-1 text-neutral-secondary">App ID:</span>
            <span>{currentApp?.id}</span>

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
              name={currentApp?.is_staging ? "api" : "rocket"}
              className="w-4 h-4"
            />
            <span>{currentApp?.is_staging ? "Staging" : "Production"}</span>
          </div>

          <div className="grid grid-cols-auto/1fr gap-x-2 items-center">
            <Icon
              name={currentApp?.engine === "cloud" ? "cloud" : "on-chain"}
              className="w-4 h-4"
            />
            <span>{currentApp?.engine === "cloud" ? "Cloud" : "On-Chain"}</span>
          </div>
        </div>

        <div className="ml-auto grid gap-x-6 grid-flow-col items-center">
          <div
            className={cn(
              "grid grid-cols-auto/1fr items-center gap-x-1 px-2 py-1 rounded-full",
              { "bg-primary-light": currentApp?.status === "active" },
              { "bg-danger-light": currentApp?.status === "inactive" }
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                { "bg-primary": currentApp?.status === "active" },
                { "bg-danger": currentApp?.status === "inactive" }
              )}
            />

            <span
              className={cn(
                "first-letter:capitalize",
                { "text-primary": currentApp?.status === "active" },
                { "text-danger": currentApp?.status === "inactive" }
              )}
            >
              {currentApp?.status}
            </span>
          </div>

          <Switch
            checked={currentApp?.status === "active"}
            toggle={toggleAppActivity}
          />
        </div>
      </div>
    </section>
  );
});
