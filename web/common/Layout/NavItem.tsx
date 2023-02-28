import { Icon, IconType } from "common/Icon";
import { Link } from "common/components/Link";
import { useRouter } from "next/router";
import { Fragment, memo, useMemo } from "react";
import cn from "classnames";

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
        "grid items-center grid-cols-auto/1fr gap-x-4 group",
        props.className
      )}
    >
      <div
        className={cn("p-2.5 text-0 transition-colors rounded-xl", {
          "group-hover:bg-f3f4f5": !props.selected,
          "bg-neutral-primary": props.selected,
        })}
      >
        <Icon
          name={props.icon}
          className={cn(
            "h-5 w-5 transition-colors",
            {
              "group-hover:text-neutral-secondary":
                !props.customColor && !props.selected,
              "text-d6d9dd": !props.selected && !props.customColor,
              "text-ffffff": props.selected && !props.customColor,
            },
            props.customColor
          )}
        />
      </div>

      <div
        className={cn(
          "font-sora text-14 grid grid-flow-col justify-start gap-x-2 items-center transition-colors",
          {
            "group-hover:text-657080": !props.customColor && !props.selected,
            "text-d6d9dd": !props.selected && !props.customColor,
            "text-neutral-primary": props.selected && !props.customColor,
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
