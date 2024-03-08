"use client";
import Link, { LinkProps } from "next/link";
import { HTMLAttributes, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { useSelectedLayoutSegment } from "next/navigation";
import clsx from "clsx";

type BottomBarLinkProps = HTMLAttributes<HTMLAnchorElement> &
  LinkProps & {
    segment: string | null;
  };

export const BottomBarLink = (props: BottomBarLinkProps) => {
  const { className, segment, ...otherProps } = props;

  const selectedLayoutSegment = useSelectedLayoutSegment();

  const active = useMemo(
    () => segment === selectedLayoutSegment,
    [segment, selectedLayoutSegment],
  );

  return (
    <Link
      className={twMerge(
        clsx("grid items-center justify-center opacity-30", {
          "opacity-100": active,
        }),
        className,
      )}
      {...otherProps}
    />
  );
};
