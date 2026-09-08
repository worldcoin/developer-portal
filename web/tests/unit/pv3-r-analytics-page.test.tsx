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

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/analytics/page";
import { getAnalyticsSidebarEligibility } from "@/scenes/PortalV3/layout/server/get-analytics-sidebar-eligibility";
import { GET } from "@/api/v2/apps/[app_id]/selfie-check-analytics";
import { ErrorPage } from "@/components/ErrorPage";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { NextRequest } from "next/server";

// #region Test Data
const props = { params: Promise.resolve({ teamId, appId }) };
const pageChildren = (page: React.ReactElement) =>
  React.Children.toArray(
    (page.props as { children: React.ReactNode }).children,
  ) as React.ReactElement<Record<string, unknown>>[];
// #endregion

// #region Agreement across entry points
describe("analytics page, sidebar, and API", () => {
  it.each([true, false])("agree on totals membership: %s", async (present) => {
    downloadCsv.mockResolvedValue({
      object: source(),
      csv: totalsCsv(present ? [appId] : [otherAppId]),
    });
    const page = pageChildren(await RoutePage(props));
    expect(page[0].type).toBe(AnalyticsAppEligibility);
    expect(page[0].props).toMatchObject({ appId, enabled: present });
    expect(page[1].type).toBe(present ? MetricsFrame : ErrorPage);
    if (!present)
      expect(page[1].props).toMatchObject({
        title: "Analytics not found",
        statusCode: 404,
      });
    expect(await getAnalyticsSidebarEligibility(appId)).toBe(present);
    const response = await GET(
      new NextRequest("http://localhost/api/analytics"),
      { params: Promise.resolve({ app_id: appId }) },
    );
    expect(response.status).toBe(present ? 200 : 403);
    expect(listCsv.mock.calls).toEqual([["total/"]]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("does not read snapshots for unauthorized direct page requests", async () => {
    GetIsUserPermittedToReadApp.mockResolvedValue({ app_by_pk: null });
    const page = pageChildren(await RoutePage(props));
    expect(page[0].props.enabled).toBe(false);
    expect(page[1].type).toBe(ErrorPage);
    expect(page[1].props).toMatchObject({
      statusCode: 404,
      title: "App not found",
    });
    expect(listCsv).not.toHaveBeenCalled();
  });

  it.each(["timeout", "malformed"])(
    "hides the optional tab but reports temporary unavailability for %s",
    async (failure) => {
      if (failure === "malformed")
        downloadCsv.mockResolvedValue({ object: source(), csv: "invalid,csv" });
      else listCsv.mockRejectedValue(new Error(failure));
      expect(await getAnalyticsSidebarEligibility(appId)).toBe(false);
      const page = pageChildren(await RoutePage(props));
      expect(page[0].props.enabled).toBe(false);
      expect(page[1].type).toBe(ErrorPage);
      expect(page[1].props).toMatchObject({
        statusCode: 503,
        title: "Analytics are temporarily unavailable",
      });
      const response = await GET(
        new NextRequest("http://localhost/api/analytics"),
        { params: Promise.resolve({ app_id: appId }) },
      );
      expect(response.status).toBe(503);
      expect(listCsv).toHaveBeenCalledTimes(1);
    },
  );

  it("passes fallback state to analytics and publishes removal after recovery", async () => {
    await RoutePage(props);
    listCsv.mockRejectedValue(new Error("S3 timeout"));
    jest.advanceTimersByTime(60_000);
    expect(
      pageChildren(await RoutePage(props))[1].props.initialIsFallback,
    ).toBe(true);
    expect(await getAnalyticsSidebarEligibility(appId)).toBe(true);
    listCsv.mockResolvedValue(source("total/", 2));
    downloadCsv.mockResolvedValue({
      object: source("total/", 2),
      csv: totalsCsv([otherAppId]),
    });
    jest.advanceTimersByTime(60_000);
    expect(pageChildren(await RoutePage(props))[0].props.enabled).toBe(false);
    expect(await getAnalyticsSidebarEligibility(appId)).toBe(false);
  });
});
// #endregion
