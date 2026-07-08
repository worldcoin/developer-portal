/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StatsRow } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page/AppStatsGraph/StatsRow";

// StatsRow renders a mobile grid and a desktop row (both present in the DOM,
// toggled by CSS), so every value appears twice — use getAllByText.
describe("StatsRow no-data rendering", () => {
  it("renders a dash for metrics with no data instead of a fake zero", () => {
    render(
      <StatsRow
        impressions={1234}
        sessions={56}
        users={7}
        newUsers={null}
        isLoading={false}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1,234").length).toBeGreaterThan(0);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("still renders a genuine zero as 0", () => {
    render(
      <StatsRow
        impressions={0}
        sessions={0}
        users={0}
        newUsers={0}
        isLoading={false}
      />,
    );
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.queryByText("—")).toBeNull();
  });
});
