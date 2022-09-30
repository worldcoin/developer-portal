import cn from "classnames";
import { useToggle } from "common/hooks";
import { Icon, IconType } from "common/Icon";
import { Link } from "common/components/Link";
import { useRouter } from "next/router";
import {
  Fragment,
  memo,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { AppType } from "types";
import { AppLogo } from "common/AppLogo";

//  @NOTE Pass options if you want item with subitems, each subitem should have "href" field. "onClick" and "href" props unavailable.
//  Pass "href" prop if you want single link item. "onClick" and "options" props unavailable.
//  Pass "onClick" prop if you want single button item. "href" and "options" props unavailable.
//  Pass "customColors" prop if you want to disable automatic color changing for item. Pass color with "className" prop.

type NavItemProps = {
  name: string;
  icon: IconType;
  className?: string;
  customColors?: boolean;

  createButton?:
    | { href?: never; onClick: () => void }
    | { href: string; onClick?: never };

  options?: Array<
    {
      name: ReactNode;
      href: string;
      app?: AppType;
      reversed?: boolean;
      id?: string;
      withoutHighlight?: boolean;
    } & (
      | {
          icon?: IconType;
          iconClassName?: string;
          dotColor?: never;
        }
      | {
          dotColor?: string;
          iconClassName?: never;
          icon?: never;
        }
    )
  >;
} & (
  | {
      onClick: () => void;
      href?: never;
    }
  | {
      href: string;
      onClick?: never;
    }
);

export const NavItem = memo(function NavItem(props: NavItemProps) {
  const router = useRouter();
  const isExternal = useMemo(() => {
    if (!props.href) {
      return;
    }

    return props.href.startsWith("http");
  }, [props.href]);

  const isCurrentSection = useMemo(() => {
    if (!props.options) {
      return router.asPath === props.href;
    }

    return props.options.some((option) => {
      const [hrefSection] = option.href.match(/(\w+)/g) || [];
      const [routerSection] = router.asPath.match(/(\w+)/g) || [];

      if (!hrefSection || !routerSection) {
        return false;
      }

      return hrefSection === routerSection;
    });
  }, [props, router]);

  const details = useToggle(isCurrentSection);

  const stateColors = useCallback(
    (isCurrent: boolean) => ({
      common: {
        "text-primary bg-f0edf9/20": isCurrent,
        "text-neutral-dark text-191c20/30": !isCurrent,
      },
      detailsSummary: {
        "text-neutral-dark": isCurrent,
        "text-neutral-dark opacity-30": !isCurrent,
      },
    }),
    []
  );

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (event.currentTarget !== event.target) {
        return;
      }

      if (router.asPath !== props.href) {
        router.push(props.href || "/");
        return details.toggleOn();
      }

      return details.toggle();
    },
    [details, props.href, router]
  );

  useEffect(() => {
    if (
      (props.options &&
        props.options.some((option) => option.href === router.asPath)) ||
      props.createButton?.href === router.asPath
    ) {
      details.toggleOn();
    }
  }, [details, props.createButton?.href, props.options, router.asPath]);

  return (
    <Fragment>
      {props.options && (
        <div>
          <button
            className={cn(
              "w-full flex justify-start items-center cursor-pointer px-3 py-4.5 rounded-lg",
              !props.customColors &&
                stateColors(
                  router.pathname === props.href ||
                    router.asPath === props.createButton?.href
                ).common,
              props.className
            )}
            onClick={onClick}
          >
            <Icon name={props.icon} className="w-6 h-6 transition-color" />
            <span className="ml-4 text-14 leading-none select-none pointer-events-none transition-color">
              {props.name}
            </span>

            <div className="ml-auto flex gap-x-3">
              {props.createButton && props.createButton.href && (
                <Link
                  href={props.createButton.href}
                  className="h-6 w-6 border flex items-center justify-center text-0 rounded-full border-f0edf9 hover:border-primary/40 transition-colors"
                >
                  <Icon name="plus" className="w-3 h-3 rounded-full" />
                </Link>
              )}

              {props.createButton && props.createButton.onClick && (
                <span
                  role="button"
                  onClick={props.createButton.onClick}
                  className="h-6 w-6 border flex items-center justify-center text-0 rounded-full border-f0edf9 hover:border-primary/40 transition-colors"
                >
                  <Icon name="plus" className="w-3 h-3 rounded-full" />
                </span>
              )}

              <span
                className=" outline-none flex items-center cursor-pointer"
                onClick={details.toggle}
                role="button"
              >
                <Icon
                  name="angle-down"
                  className={cn(
                    { "rotate-180": details.isOn },
                    "w-6 h-6 transition-all"
                  )}
                />
              </span>
            </div>
          </button>

          <div
            className={cn(
              { "max-h-[1000px]": details.isOn },
              {
                "max-h-0 select-none invisible pointer-events-none":
                  !details.isOn,
              },
              "overflow-hidden transition-all grid"
            )}
          >
            {props.options.map((item, index) => (
              <Link
                key={`nav-option-${index}`}
                href={item.href}
                className="relative max-w-[280px]"
              >
                <div
                  className={cn(
                    "px-4.5 py-4 cursor-pointer grid grid-cols-auto/1fr gap-x-4 items-center justify-items-start select-none",
                    "rounded-lg text-14",
                    !item.withoutHighlight &&
                      stateColors(
                        router.query.app_id
                          ? router.query.app_id === item.id
                          : router.asPath === item.href
                      ).common,

                    item.withoutHighlight && stateColors(false).common,
                    props.className
                  )}
                >
                  {item.app && (
                    <div className="relative h-6 w-6">
                      <AppLogo app={item.app} />

                      {item.dotColor && (
                        <div className="z-10 absolute bottom-0 right-0 rounded-full w-2 h-2 bg-ffffff p-px">
                          <span
                            className={cn(
                              "w-full h-full flex rounded-full",
                              item.dotColor
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={cn("flex items-center justify-center gap-x-1", {
                      "flex-row-reverse": item.reversed,
                      "pl-9": !item.app,
                    })}
                  >
                    {item.icon && (
                      <Icon
                        name={item.icon}
                        className={cn("w-5 h-5", item.iconClassName)}
                      />
                    )}

                    <div className="grid">
                      <span className="truncate leading-tight text-14">
                        {item.name}
                      </span>

                      {item.app && (
                        <span className="truncate leading-none text-11">
                          {`In ${item.app.name}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!props.options && props.href && (
        <Link
          href={props.href}
          external={isExternal}
          target={isExternal ? "_blank" : ""}
          className={cn(
            "grid grid-flow-col justify-start items-center gap-x-4 px-3 py-4.5 cursor-pointer rounded-lg",
            !props.customColors && stateColors(isCurrentSection).common,
            props.className
          )}
        >
          <Icon name={props.icon} className="w-6 h-6 transition-colors" />

          <span className="text-14 leading-none transition-colors">
            {props.name}
          </span>

          {isExternal && (
            <Icon name="external" className="w-6 h-6 transition-colors" />
          )}
        </Link>
      )}

      {!props.options && props.onClick && (
        <button
          onClick={props.onClick}
          className={cn(
            "grid grid-flow-col justify-start items-center gap-x-4 px-3 py-4.5 cursor-pointer rounded-lg",
            !props.customColors && stateColors(isCurrentSection).common,
            props.className
          )}
        >
          <Icon name={props.icon} className="w-6 h-6 transition-colors" />

          <span className="text-14 leading-none transition-colors">
            {props.name}
          </span>

          {isExternal && (
            <Icon name="external" className="w-6 h-6 transition-colors" />
          )}
        </button>
      )}
    </Fragment>
  );
});
