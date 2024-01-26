import { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";
import { twMerge } from "tailwind-merge";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tab = tv({
  base: "block px-1 py-3 leading-4",
  variants: {
    active: {
      true: "text-grey-900 cursor-default",
      false: "text-grey-500",
    },
    underlined: {
      true: "",
    },
  },
  compoundVariants: [
    {
      active: true,
      underlined: true,
      class: "shadow-[0_1px_0_0]",
    },
  ],
});

type TabProps = HTMLAttributes<HTMLAnchorElement> &
  LinkProps & {
    underlined?: boolean;
  };

export const Tab = (props: TabProps) => {
  const { className, children, underlined, ...otherProps } = props;
  const pathname = usePathname();
  const active = pathname === props.href;

  return (
    <Link className={tab({ active, underlined, className })} {...otherProps}>
      {children}
    </Link>
  );
};
