"use client";

import clsx from "clsx";
import { CollapseIcon } from "@/components/Icons/CollapseIcon";
import { ExpandIcon } from "@/components/Icons/ExpandIcon";
import { useNav } from "../NavProvider";

type CollapseButtonProps = {
  className?: string;
};

export const CollapseButton = ({ className }: CollapseButtonProps) => {
  const { isCollapsed, setIsCollapsed } = useNav();

  return (
    <button
      type="button"
      aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      aria-expanded={!isCollapsed}
      aria-controls="admin-nav-items"
      className={clsx(
        "hidden place-items-center rounded-8 px-3 py-1.5 text-grey-400 outline-hidden transition-colors hover:bg-grey-100 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none",
        "lg:grid",
        "3xl:px-4 3xl:py-2",
        "4xl:px-5 4xl:py-2.5",
        className,
      )}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {isCollapsed ? (
        <ExpandIcon className={clsx("size-4", "3xl:size-5", "4xl:size-7")} />
      ) : (
        <CollapseIcon className={clsx("size-4", "3xl:size-5", "4xl:size-7")} />
      )}
    </button>
  );
};
