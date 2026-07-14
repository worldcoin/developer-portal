/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { useTrendWindow } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/use-trend-window";

it("uses a lifetime window when creation time is unavailable", () => {
  const { result } = renderHook(() =>
    useTrendWindow({ createdAt: null, timePeriod: "all-time" }),
  );

  expect(result.current.allTimeBounds[0]).toBe(new Date(0).toISOString());
  expect(result.current.selectedBounds).toBe(result.current.allTimeBounds);
  expect(result.current.allTimeBounds).not.toEqual(result.current.weeklyBounds);
});
