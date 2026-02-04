"use client";

import Link, { LinkProps } from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { HTMLAttributes, useMemo } from "react";
import { tv } from "tailwind-variants";

const tab = tv({
  base: "block cursor-pointer px-4 py-2.5 leading-5 md:px-1 md:py-3 md:leading-4",
  variants: {
    active: {
      true: "cursor-default rounded-full bg-grey-0 text-grey-900 shadow-tab md:rounded-none md:bg-transparent md:shadow-none",
      false: "cursor-pointer text-grey-500",
    },
    underlined: {
      true: "",
    },
  },
  compoundVariants: [
    {
      active: true,
      underlined: true,
    },
  ],
});

type TabProps = HTMLAttributes<HTMLAnchorElement> &
  LinkProps & {
    underlined?: boolean;
    segment: string | null;
    active?: boolean;
  };

export const Tab = (props: TabProps) => {
  const {
    className,
    children,
    style = {},
    underlined,
    active: manualActive,
    ...otherProps
  } = props;
  const selectedLayoutSegment = useSelectedLayoutSegment();

  const active = useMemo(() => {
    // If active is manually provided, use it; otherwise compute from segment
    if (manualActive !== undefined) {
      return manualActive;
    }

    return props.segment === selectedLayoutSegment;
  }, [manualActive, props.segment, selectedLayoutSegment]);

  return (
    <Link
      className={tab({ active, underlined, className })}
      style={{
        ...style,
        scrollSnapAlign: "start",
      }}
      {...otherProps}
    >
      {children}
    </Link>
  );
};
