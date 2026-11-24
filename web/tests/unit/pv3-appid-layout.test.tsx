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

import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
import { AppAnalyticsEligibility } from "@/scenes/PortalV3/layout/server/app-analytics-eligibility";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { ErrorPage } from "@/components/ErrorPage";

// #region Layout streaming and access
it("returns the surrounding layout before a cold optional snapshot lookup completes", async () => {
  listCsv.mockReturnValue(new Promise(() => {}));
  const child = <div>Surrounding page</div>;
  const layout = await AppIdLayout({
    params: { appId, teamId },
    children: child,
  });
  const children = React.Children.toArray(
    layout.props.children,
  ) as React.ReactElement[];
  expect(children[1].props).toBe(child.props);
  expect(children[0].type).toBe(React.Suspense);
  expect(children[0].props).toMatchObject({ fallback: null });
  expect(
    (children[0].props as { children: React.ReactElement }).children.type,
  ).toBe(AppAnalyticsEligibility);
  expect(listCsv).not.toHaveBeenCalled();
});

it.each([true, false])(
  "publishes verified sidebar membership %s",
  async (present) => {
    downloadCsv.mockResolvedValue({
      object: source(),
      csv: totalsCsv(present ? [appId] : [otherAppId]),
    });
    const verdict = await AppAnalyticsEligibility({ appId });
    expect(verdict.type).toBe(AnalyticsAppEligibility);
    expect(verdict.props).toMatchObject({ appId, enabled: present });
  },
);

it("hides the optional tab when no snapshot is available", async () => {
  listCsv.mockRejectedValue(new Error("S3 timeout"));
  expect((await AppAnalyticsEligibility({ appId })).props.enabled).toBe(false);
  expect(logger.warn).toHaveBeenCalled();
});

it("retains the app access check and clears a previous sidebar verdict", async () => {
  GetIsUserPermittedToReadApp.mockResolvedValue({ app_by_pk: null });
  const layout = await AppIdLayout({ params: { appId }, children: <div /> });
  const children = React.Children.toArray(
    layout.props.children,
  ) as React.ReactElement<Record<string, unknown>>[];
  expect(children[0].type).toBe(AnalyticsAppEligibility);
  expect(children[0].props.enabled).toBe(false);
  expect(children[1].type).toBe(ErrorPage);
  expect(listCsv).not.toHaveBeenCalled();
});

it("rejects missing app IDs without I/O", async () => {
  const layout = await AppIdLayout({ params: {}, children: <div /> });
  expect(layout.type).toBe(ErrorPage);
  expect(GetIsUserPermittedToReadApp).not.toHaveBeenCalled();
  expect(listCsv).not.toHaveBeenCalled();
});
// #endregion
