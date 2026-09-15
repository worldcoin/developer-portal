/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StackedMetricTooltip } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/StackedMetricTooltip";

describe("StackedMetricTooltip", () => {
  it("lists each visible series and its total", () => {
    render(
      <StackedMetricTooltip
        active
        formatLabel={(value) => value}
        formatValue={(value) => value.toLocaleString("en-US")}
        label="Sep 3"
        payload={[
          { name: "Android", value: 12 },
          { name: "iOS", value: 8 },
        ]}
        series={[
          { color: "#A4C639", name: "Android" },
          { color: "#1C98F7", name: "iOS" },
        ]}
      />,
    );

    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.getByText("iOS")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
