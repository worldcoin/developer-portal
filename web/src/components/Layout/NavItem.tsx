import cn from "classnames";
import { useRouter } from "next/router";
import { Fragment, ReactNode, memo, useMemo } from "react";
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
  disabled?: boolean;
  stamp?: ReactNode;
  stampVisible?: boolean;
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
        "grid items-center grid-cols-auto/1fr gap-x-3 border text-gray-400 hover:bg-gray-100 hover:text-gray-500 rounded-xl transition-colors p-3",

        {
          "text-gray-900 bg-white  border-gray-200 hover:bg-white/70":
            props.selected && !props.customColor,
        },

        { "border-transparent": !props.selected },
        { "hover:bg-transparent hover:text-gray-400": props.disabled },
        props.className
      )}
    >
      <Icon
        name={props.icon}
        className={cn(
          "h-5 w-5",
          { "text-gray-900": props.selected && !props.customColor },
          props.customColor
        )}
      />

      <div
        className={cn(
          "font-sora text-14 grid grid-flow-col justify-start gap-x-2 items-center",
          {
            "text-gray-900": props.selected && !props.customColor,
          },
          props.customColor
        )}
      >
        <span>{props.name}</span>

        {props.external && <Icon name="external" className="h-4 w-4" />}
        {props.stamp && props.stampVisible && props.stamp}
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
      {props.disabled && (
        <span>
          <CommonNavItem
            name={props.name}
            icon={props.icon}
            className={cn("select-none cursor-not-allowed", props.className)}
            stamp={props.stamp}
            stampVisible={props.stampVisible}
            disabled
          />
        </span>
      )}

      {props.onClick && !props.disabled && (
        <button type="button" onClick={props.onClick}>
          <CommonNavItem
            name={props.name}
            icon={props.icon}
            className={props.className}
            stamp={props.stamp}
            stampVisible={props.stampVisible}
          />
        </button>
      )}

      {props.href && !props.disabled && (
        <Link href={props.href} external={isExternal}>
          <CommonNavItem
            name={props.name}
            icon={props.icon}
            className={props.className}
            external={isExternal}
            selected={isCurrentSection}
            customColor={props.customColor}
            stamp={props.stamp}
            stampVisible={props.stampVisible}
          />
        </Link>
      )}
    </Fragment>
  );
});
