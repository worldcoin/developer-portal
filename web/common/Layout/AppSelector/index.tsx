import cn from "classnames";
import { useToggle } from "common/hooks";
import { Icon } from "common/Icon";
import { Link } from "common/components/Link";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo } from "react";
import { urls } from "urls";
import { apps } from "../temp-data";

type App = (typeof apps)[number];

export const ButtonContent = memo(function ButtonContent(props: {
  app: App;
  selected?: boolean;
  className?: string;
  withoutArrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-auto/1fr/auto gap-x-3 group hover:opacity-100 transition-opacity",
        { "opacity-50": !props.selected },
        props.className
      )}
    >
      <Image src={props.app.logo_url} width={20} height={20} alt="app logo" />
      <span className="text-start font-sora text-14 truncate max-w-[13ch] mr-auto">
        {props.app.name}
      </span>

      {props.selected && !props.withoutArrow && (
        <Icon
          name="angle-down"
          className="group-hover:translate-x-1 transition-transform w-5 h-5 -rotate-90 ml-auto"
        />
      )}
    </div>
  );
});

export const AppSelector = memo(function AppsSelector(props: {
  currentApp: App;
  apps: App[];
}) {
  const selector = useToggle();

  const isSelected = useCallback(
    (app: App) => app.id === props.currentApp.id,
    [props.currentApp]
  );

  const appsToRender = useMemo(
    () => props.apps.filter((app) => !isSelected(app)),
    [props.apps, isSelected]
  );

  return (
    <div className="relative h-12">
      <Link
        href={urls.app(props.currentApp.id)}
        className="absolute top-0 -right-12 text-0 bg-fbfbfc border border-ebecef rounded-xl leading-none p-[11px]"
      >
        <Icon name="angle-down" className="w-5 h-5 -rotate-90" />
      </Link>

      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-fbfbfc border border-ebecef rounded-xl transition-[max-height] overflow-hidden z-10",
          { "max-h-11": !selector.isOn },
          { "max-h-48": selector.isOn }
        )}
      >
        <button
          className="grid grid-cols-1fr/auto items-center w-full px-4 py-3 outline-none"
          aria-haspopup="true"
          aria-expanded="true"
          onClick={selector.toggle}
        >
          <ButtonContent
            app={props.currentApp}
            selected={isSelected(props.currentApp)}
            withoutArrow
          />
          <Icon
            name="angle-down"
            className={cn("w-5 h-5 transition-transform", {
              "rotate-180": selector.isOn,
            })}
          />
        </button>

        <div className="grid">
          {appsToRender.map((app) => (
            <Link href={urls.app(app.id)} key={app.id}>
              <ButtonContent
                app={app}
                className={cn("px-4 py-3")}
                selected={isSelected(app)}
              />
            </Link>
          ))}

          <Link
            href={urls.appNew()}
            className="grid grid-cols-auto/1fr items-center gap-x-3 py-3 px-4"
          >
            <Icon name="plus" className="w-5 h-5" />
            <span>Add new app</span>
          </Link>
        </div>
      </div>
    </div>
  );
});
