import cn from "classnames";
import { useRouter } from "next/router";
import { Fragment, memo, useMemo } from "react";
import { Icon, IconType } from "src/components/Icon";
import { Link } from "src/components/Link";

// NOTE: Pass "href" prop if you want link item.
//  Pass "onClick" prop if you want button item.

type CommonNavItemProps = {
  name: string;
  icon: IconType;
  className?: string;
  external?: boolean;
  selected?: boolean;
  //NOTE: tailwindcss color
  customColor?: string;
};

type NavItemProps = Omit<CommonNavItemProps, "selected"> &
  (
    | {
        onClick: () => void;
        href?: never;
      }
    | {
        href: string;
        onClick?: never;
      }
  );

const CommonNavItem = memo(function CommonNavItem(props: CommonNavItemProps) {
  return (
    <div
      className={cn(
        "grid items-center grid-cols-auto/1fr gap-x-4 text-neutral-secondary hover:bg-f3f4f5 hover:text-neutral-primary rounded-xl transition-colors",
        {
          "bg-neutral-primary hover:bg-neutral-primary":
            props.selected && !props.customColor,
        },
        props.className
      )}
    >
      <div className={cn("p-2.5 text-0")}>
        <Icon
          name={props.icon}
          className={cn(
            "h-5 w-5",
            {
              "text-white": props.selected && !props.customColor,
            },
            props.customColor
          )}
        />
      </div>

      <div
        className={cn(
          "font-sora text-14 grid grid-flow-col justify-start gap-x-2 items-center",
          {
            "text-white": props.selected && !props.customColor,
          },
          props.customColor
        )}
      >
        <span>{props.name}</span>

        {props.external && <Icon name="external" className="h-4 w-4" />}
      </div>
    </div>
  );
});

export const NavItem = memo(function NavItem(props: NavItemProps) {
  const router = useRouter();
  const isExternal = useMemo(() => {
    if (!props.href) {
      return false;
    }

    return props.href.startsWith("http") ?? false;
  }, [props.href]);

  const isCurrentSection = useMemo(
    () => router.asPath === props.href,
    [props, router]
  );

  return (
    <Fragment>
      {props.onClick && (
        <button type="button" onClick={props.onClick}>
          <CommonNavItem
            name={props.name}
            icon={props.icon}
            className={props.className}
          />
        </button>
      )}

      {props.href && (
        <Link href={props.href} external={isExternal}>
          <CommonNavItem
            name={props.name}
            icon={props.icon}
            className={props.className}
            external={isExternal}
            selected={isCurrentSection}
            customColor={props.customColor}
          />
        </Link>
      )}
    </Fragment>
  );
});
