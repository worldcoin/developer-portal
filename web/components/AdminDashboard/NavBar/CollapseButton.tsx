"use client";

import clsx from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
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
        // Collapsing only makes sense for the desktop sidebar, hidden on mobile
        "hidden place-items-center rounded-8 px-3 py-1.5 text-grey-400 outline-none transition-colors hover:bg-grey-100 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none lg:grid",
        className,
      )}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {isCollapsed ? <PanelLeft size={16} /> : <PanelRight size={16} />}
    </button>
  );
};
