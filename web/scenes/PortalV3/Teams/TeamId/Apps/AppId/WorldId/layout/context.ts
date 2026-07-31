"use client";

import { createContext, useContext } from "react";

export type WorldIdActionItem = {
  id: string;
  action: string;
  description: string;
};

export type WorldIdLayoutContextValue = {
  teamId: string;
  appId: string;
  canManageWorldId: boolean;
  actions: WorldIdActionItem[];
  actionsSearch: string;
  hasActiveRp: boolean;
  shouldOpenCreateAction: boolean;
  consumeCreateAction: () => void;
  refreshOverview: () => void;
};

export const WorldIdLayoutContext =
  createContext<WorldIdLayoutContextValue | null>(null);

export const useWorldIdLayout = () => {
  const context = useContext(WorldIdLayoutContext);

  if (!context) {
    throw new Error("useWorldIdLayout must be used within WorldIdLayout");
  }

  return context;
};
