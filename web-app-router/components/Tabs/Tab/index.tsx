"use client";

import { HTMLAttributes, useMemo } from "react";
import { tv } from "tailwind-variants";
import Link, { LinkProps } from "next/link";
import { useSelectedLayoutSegment, useSearchParams } from "next/navigation";

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
    segment: string | null;
  };

export const Tab = (props: TabProps) => {
  const { className, children, underlined, ...otherProps } = props;
  const selectedLayoutSegment = useSelectedLayoutSegment();

  const active = useMemo(
    () => props.segment === selectedLayoutSegment,
    [props.segment, selectedLayoutSegment],
  );

  return (
    <Link className={tab({ active, underlined, className })} {...otherProps}>
      {children}
    </Link>
  );
};
