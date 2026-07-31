export const WORLD_ID_TABS = {
  Actions: "actions",
  Configuration: "configuration",
  LegacyActions: "legacy-actions",
} as const;

export type WorldIdTab = (typeof WORLD_ID_TABS)[keyof typeof WORLD_ID_TABS];

const isWorldIdTab = (value: string): value is WorldIdTab =>
  Object.values(WORLD_ID_TABS).some((tab) => tab === value);

export const normalizeWorldIdTab = (value: string | null) => {
  if (value === "world-id-4-0") return WORLD_ID_TABS.Configuration;
  return value && isWorldIdTab(value) ? value : null;
};

export const resolveAvailableWorldIdTab = (options: {
  requestedTab: string | null;
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
}): WorldIdTab => {
  const requestedTab = normalizeWorldIdTab(options.requestedTab);
  const defaultTab = options.hasRpRegistration
    ? WORLD_ID_TABS.Actions
    : WORLD_ID_TABS.Configuration;

  if (requestedTab === WORLD_ID_TABS.Actions && !options.hasRpRegistration) {
    return WORLD_ID_TABS.Configuration;
  }

  if (
    requestedTab === WORLD_ID_TABS.LegacyActions &&
    !options.hasLegacyActions
  ) {
    return defaultTab;
  }

  return requestedTab ?? defaultTab;
};

export const resolveActiveWorldIdTab = (options: {
  requestedTab: string | null;
  hasRpRegistration: boolean;
  hasActiveRp: boolean;
  hasLegacyActions: boolean;
  enableRequested: boolean;
  createRequested: boolean;
}): WorldIdTab => {
  if (options.createRequested) {
    return options.hasActiveRp
      ? WORLD_ID_TABS.Actions
      : WORLD_ID_TABS.Configuration;
  }

  if (options.enableRequested) return WORLD_ID_TABS.Configuration;

  return resolveAvailableWorldIdTab(options);
};
