import {
  resolveActiveWorldIdTab,
  resolveAvailableWorldIdTab,
  WORLD_ID_TABS,
} from "@/lib/world-id-tabs";
import { urls } from "@/lib/urls";

const availableDefaults = {
  requestedTab: null,
  hasRpRegistration: true,
  hasLegacyActions: false,
};

describe("resolveAvailableWorldIdTab", () => {
  it("defaults to Actions with an RP and Configuration without one", () => {
    expect(resolveAvailableWorldIdTab(availableDefaults)).toBe(
      WORLD_ID_TABS.Actions,
    );
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        hasRpRegistration: false,
      }),
    ).toBe(WORLD_ID_TABS.Configuration);
  });

  it("keeps available tabs and maps the old World ID tab alias", () => {
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        requestedTab: WORLD_ID_TABS.LegacyActions,
        hasLegacyActions: true,
      }),
    ).toBe(WORLD_ID_TABS.LegacyActions);
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        requestedTab: "world-id-4-0",
      }),
    ).toBe(WORLD_ID_TABS.Configuration);
  });

  it("falls back when a requested tab is invalid or unavailable", () => {
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        requestedTab: "unknown",
      }),
    ).toBe(WORLD_ID_TABS.Actions);
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        requestedTab: WORLD_ID_TABS.Actions,
        hasRpRegistration: false,
      }),
    ).toBe(WORLD_ID_TABS.Configuration);
    expect(
      resolveAvailableWorldIdTab({
        ...availableDefaults,
        requestedTab: WORLD_ID_TABS.LegacyActions,
      }),
    ).toBe(WORLD_ID_TABS.Actions);
  });
});

describe("resolveActiveWorldIdTab", () => {
  const intentDefaults = {
    ...availableDefaults,
    hasActiveRp: false,
    enableRequested: false,
    createRequested: false,
  };

  it("opens setup intents in Configuration", () => {
    expect(
      resolveActiveWorldIdTab({
        ...intentDefaults,
        hasRpRegistration: false,
        enableRequested: true,
      }),
    ).toBe(WORLD_ID_TABS.Configuration);
    expect(
      resolveActiveWorldIdTab({
        ...intentDefaults,
        hasRpRegistration: false,
        createRequested: true,
      }),
    ).toBe(WORLD_ID_TABS.Configuration);
  });

  it("gives an actionable create intent precedence over another tab", () => {
    expect(
      resolveActiveWorldIdTab({
        ...intentDefaults,
        requestedTab: WORLD_ID_TABS.LegacyActions,
        hasActiveRp: true,
        hasLegacyActions: true,
        createRequested: true,
      }),
    ).toBe(WORLD_ID_TABS.Actions);
  });
});

describe("urls.worldIdTab", () => {
  it("sets one canonical tab while preserving unrelated query state", () => {
    expect(
      urls.worldIdTab({
        team_id: "team_1",
        app_id: "app_1",
        tab: WORLD_ID_TABS.Configuration,
        query: { tab: "world-id-4-0", keep: "this" },
      }),
    ).toBe("/teams/team_1/apps/app_1/world-id?tab=configuration&keep=this");
  });
});
