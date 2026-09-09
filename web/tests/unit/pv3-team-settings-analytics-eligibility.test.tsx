import {
  listCsv,
  downloadCsv,
  GetIsUserPermittedToReadApp,
} from "../fixtures/selfie-check-analytics-server";
import {
  appId,
  otherAppId,
  teamId,
  source,
  totalsCsv,
} from "../fixtures/selfie-check-analytics";
import { logger } from "@/lib/logger";
import React from "react";

import { TeamSettingsAnalyticsEligibility } from "@/scenes/PortalV3/layout/server/team-settings-analytics-eligibility";

// #region Restored sidebar
const resolve = (returnTo = `/teams/${teamId}/apps/${appId}/configuration`) =>
  TeamSettingsAnalyticsEligibility({ teamId, returnTo });

it.each([true, false])(
  "restores verified totals membership %s",
  async (present) => {
    downloadCsv.mockResolvedValue({
      object: source(),
      csv: totalsCsv(present ? [appId] : [otherAppId]),
    });
    expect((await resolve())?.props).toMatchObject({ appId, enabled: present });
    expect(listCsv.mock.calls).toEqual([["total/"]]);
  },
);

it("does not trust return_to from another team", async () => {
  expect(
    await resolve(`/teams/team_other/apps/${appId}/configuration`),
  ).toBeNull();
  expect(GetIsUserPermittedToReadApp).not.toHaveBeenCalled();
  expect(listCsv).not.toHaveBeenCalled();
});

it("checks app access before eligibility", async () => {
  GetIsUserPermittedToReadApp.mockResolvedValue({ app_by_pk: null });
  expect((await resolve())?.props.enabled).toBe(false);
  expect(listCsv).not.toHaveBeenCalled();
});

it.each(["hasura", "s3"])(
  "keeps settings available during a %s outage",
  async (dependency) => {
    (dependency === "hasura"
      ? GetIsUserPermittedToReadApp
      : listCsv
    ).mockRejectedValue(new Error("Unavailable"));
    expect((await resolve())?.props.enabled).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  },
);
// #endregion
