"use client";

import { createContext, useContext, useMemo, useState } from "react";

export const NavContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const value = useMemo(() => ({ isCollapsed, setIsCollapsed }), [isCollapsed]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

export const useNav = () => {
  return useContext(NavContext);
};
