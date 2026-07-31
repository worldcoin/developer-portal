"use client";

import type { EngineType } from "@/lib/types";
import type { WorldIdTab } from "@/lib/world-id-tabs";
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
  activeTab: WorldIdTab;
  appEngine?: EngineType;
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
