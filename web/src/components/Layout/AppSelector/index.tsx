import cn from "classnames";
import Image from "next/image";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IAppStore, useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { AppModel } from "src/lib/models";
import useApps from "src/hooks/useApps";
import { Link } from "src/components/Link";
import { useRouter } from "next/router";
import { useToggle } from "src/hooks/useToggle";
import { Icon } from "src/components/Icon";
import { Menu } from "@headlessui/react";
import AnimateHeight from "react-animate-height";
import { Button } from "src/components/Button";
import { getCDNImageUrl } from "@/lib/utils";

export const ButtonContent = memo(function ButtonContent(props: {
  app: AppModel;
  selected?: boolean;
  className?: string;
}) {
  const [image, setImage] = useState<string | null>(
    props.app?.verified_app_metadata?.logo_img_url
      ? getCDNImageUrl(
          props.app.id,
          props.app.verified_app_metadata?.logo_img_url
        )
      : ""
  );

  useEffect(() => {
    if (!props.app.verified_app_metadata?.logo_img_url) {
      return;
    }
    setImage(
      getCDNImageUrl(
        props.app.id,
        props.app.verified_app_metadata?.logo_img_url
      )
    );
  }, [
    props.app.app_metadata?.logo_img_url,
    props.app?.id,
    props.app.verified_app_metadata?.logo_img_url,
  ]);

  return (
    <div
      className={cn(
        "grid grid-cols-auto/1fr/auto gap-x-3 group transition-opacity",
        { "opacity-50 hover:opacity-100": !props.selected },
        { "opacity-100 hover:opacity-70": props.selected },
        props.className
      )}
    >
      <div>
        {image && (
          <Image
            src={image}
            width={20}
            height={20}
            alt="app logo"
            onError={() => setImage(null)}
          />
        )}

        {!image && (
          <div className="w-5 h-5 rounded-full bg-primary-light flex justify-center items-center">
            <span className="text-primary text-12">
              {props.app.app_metadata?.name[0] ?? "?"}
            </span>
          </div>
        )}
      </div>
      <span className="text-start font-sora text-14 truncate max-w-[13ch] mr-auto text-gray-900 transition-colors">
        {props.app?.app_metadata?.name}
      </span>
    </div>
  );
});

const getStore = (store: IAppStore) => ({
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
  const { currentApp } = useAppStore(getStore, shallow);
  const router = useRouter();

  const team_id = useMemo(() => router.query.team_id as string, [router]);

  const handleNewAppClick = useCallback(() => {
    selector.toggleOff();
    props.onNewAppClick();
  }, [props, selector]);

  const isSelected = useCallback(
    (app: AppModel) => app?.id === currentApp?.id,
    [currentApp]
  );

  const appsToRender = useMemo(
    () =>
      apps
        ?.filter((app) => !isSelected(app))
        .sort((a, b) =>
          a.app_metadata?.name.localeCompare(b.app_metadata?.name)
        ),
    [apps, isSelected]
  );

  const getHref = useCallback(
    (id: string) => {
      const pathname = router.pathname;

      if (pathname.startsWith("/team/[team_id]/app/[app_id]")) {
        return `/team/${team_id}/app/${id}${pathname.replace(
          "/team/[team_id]/app/[app_id]",
          ""
        )}`;
      }

      return `/team/${team_id}/app/${id}`;
    },
    [router.pathname, team_id]
  );

  return (
    <Fragment>
      {apps?.length === 0 && (
        <Button onClick={handleNewAppClick} className="px-4 py-3 text-white">
          <span className="text-start font-sora text-14 mr-auto transition-colors">
            Create New App
          </span>

          <Icon name="plus" className="w-5 h-5" />
        </Button>
      )}

      {(apps?.length ?? 0) > 0 && (
        <Menu as="div" className="relative h-[44px] peer">
          {({ open }) => (
            <div
              className={cn(
                "absolute top-0 left-0 right-0 min-h-[44px] bg-fbfbfc border border-ebecef rounded-xl z-10 transition-shadow duration-300",
                {
                  "shadow-input": open,
                }
              )}
            >
              <Menu.Button className="flex items-center justify-between w-full h-11 px-4 py-3 outline-none">
                {currentApp && (
                  <ButtonContent
                    app={currentApp}
                    selected={isSelected(currentApp)}
                  />
                )}

                {!currentApp && (
                  <span className="text-14 text-gray-900 font-sora">
                    Select app
                  </span>
                )}

                <Icon
                  name="angle-down"
                  className={cn("w-5 h-5 transition-transform", {
                    "rotate-180": open,
                  })}
                />
              </Menu.Button>

              <AnimateHeight
                id="example-panel"
                duration={300}
                height={open ? "auto" : 0}
              >
                <Menu.Items className="relative" static>
                  {appsToRender?.map((app) => (
                    <Menu.Item key={app.id} as={Link} href={getHref(app.id)}>
                      <ButtonContent
                        app={app}
                        className="px-4 py-3"
                        selected={isSelected(app)}
                      />
                    </Menu.Item>
                  ))}

                  <Menu.Item>
                    <button
                      onClick={handleNewAppClick}
                      className="grid grid-cols-auto/1fr items-center gap-x-3 py-3 px-4 text-gray-900 transition-colors hover:text-gray-900/70"
                    >
                      <Icon name="plus" className="w-5 h-5" />
                      <span className="text-start leading-none">
                        Add new app
                      </span>
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </AnimateHeight>
            </div>
          )}
        </Menu>
      )}
    </Fragment>
  );
});
