"use client";

import { PanelLeft, PanelRight } from "lucide-react";
import { useNav } from "../NavProvider";

export const CollapseButton = () => {
  const { isCollapsed, setIsCollapsed } = useNav();

  return (
    <button
      type="button"
      aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      aria-expanded={!isCollapsed}
      aria-controls="admin-nav-items"
      className="grid place-items-center rounded-8 px-3 py-2 text-grey-500 outline-none hover:bg-grey-200 focus-visible:ring-2 focus-visible:ring-blue-500"
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {isCollapsed ? <PanelLeft size={16} /> : <PanelRight size={16} />}
    </button>
  );
};
