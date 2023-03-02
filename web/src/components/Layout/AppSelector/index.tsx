import cn from "classnames";
import { useToggle } from "src/hooks/useToggle";
import { Icon } from "src/components/Icon";
import Image from "next/image";
import { Fragment, memo, useCallback, useMemo, useState } from "react";
import { AppStore, useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { AppModel } from "src/lib/models";
import useApps from "src/hooks/useApps";
import { Link } from "src/components/Link";
import { useRouter } from "next/router";

export const ButtonContent = memo(function ButtonContent(props: {
  app: AppModel;
  selected?: boolean;
  className?: string;
}) {
  const [image, setImage] = useState<string | null>(props.app.logo_url);

  return (
    <div
      className={cn(
        "grid grid-cols-auto/1fr/auto gap-x-3 group hover:opacity-100 transition-opacity",
        { "opacity-50": !props.selected },
        props.className
      )}
    >
      <div>
        {image && (
          <Image
            src={props.app?.logo_url}
            width={20}
            height={20}
            alt="app logo"
            onError={() => setImage(null)}
          />
        )}

        {!image && (
          <div className="w-5 h-5 rounded-full bg-primary-light flex justify-center items-center">
            <span className="text-primary text-12">{props.app.name[0]}</span>
          </div>
        )}
      </div>
      <span className="text-start font-sora text-14 truncate max-w-[13ch] mr-auto text-neutral-dark">
        {props.app?.name}
      </span>
    </div>
  );
});

const getStore = (store: AppStore) => ({
  apps: store.apps,
  currentApp: store.currentApp,
  setApps: store.setApps,
  setCurrentApp: store.setCurrentApp,
});

export const AppSelector = memo(function AppsSelector(props: {
  onNewAppClick: () => void;
}) {
  const selector = useToggle();
  const { apps } = useApps();
  const { currentApp, setCurrentApp } = useAppStore(getStore, shallow);
  const router = useRouter();

  const selectApp = useCallback(
    (app: AppModel) => {
      setCurrentApp(app);
      selector.toggleOff();
    },
    [setCurrentApp, selector]
  );

  const handleNewAppClick = useCallback(() => {
    selector.toggleOff();
    props.onNewAppClick();
  }, [props, selector]);

  const isSelected = useCallback(
    (app: AppModel) => app?.id === currentApp?.id,
    [currentApp]
  );

  const appsToRender = useMemo(
    () => apps?.filter((app) => !isSelected(app)),
    [apps, isSelected]
  );

  const getHref = useCallback(
    (id: string) => {
      const route = router.pathname.replace("/app/[app_id]", "");

      if (!route) {
        return `/app/${id}`;
      }

      return `/app/${id}${route}`;
    },
    [router.pathname]
  );

  return (
    <div className="relative h-12">
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-fbfbfc border border-ebecef rounded-xl transition-[max-height] overflow-hidden min-h-[44px] z-10",
          { "max-h-11": !selector.isOn },
          { "max-h-48": selector.isOn }
        )}
      >
        {apps && currentApp && (
          <Fragment>
            <button
              className="grid grid-cols-1fr/auto items-center w-full px-4 py-3 outline-none"
              aria-haspopup="true"
              aria-expanded="true"
              onClick={selector.toggle}
            >
              <ButtonContent
                app={currentApp}
                selected={isSelected(currentApp)}
              />
              <Icon
                name="angle-down"
                className={cn("w-5 h-5 transition-transform", {
                  "rotate-180": selector.isOn,
                })}
              />
            </button>

            <div className="grid">
              {appsToRender?.map((app) => (
                <Link
                  href={getHref(app.id)}
                  onClick={() => selectApp(app)}
                  key={app.id}
                >
                  <ButtonContent
                    app={app}
                    className={cn("px-4 py-3")}
                    selected={isSelected(app)}
                  />
                </Link>
              ))}

              <button
                onClick={handleNewAppClick}
                className="grid grid-cols-auto/1fr items-center gap-x-3 py-3 px-4"
              >
                <Icon name="plus" className="w-5 h-5" />
                <span className="text-start leading-none">Add new app</span>
              </button>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
});
