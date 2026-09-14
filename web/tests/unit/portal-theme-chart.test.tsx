/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Chart, type ChartProps } from "@/components/Chart";
import { readFileSync } from "node:fs";
import postcss from "postcss";

// #region External theme and canvas boundaries; palette resolution stays real
let mockTheme = {
  resolvedTheme: "dark",
  forcedTheme: undefined as string | undefined,
};
jest.mock("next-themes", () => ({ useTheme: () => mockTheme }));
jest.mock("react-chartjs-2", () => ({
  Line: (props: unknown) => (
    <output data-testid="chart">{JSON.stringify(props)}</output>
  ),
}));
// #endregion

const data: ChartProps["data"] = {
  x: ["Today"],
  y: [{ data: [1], borderColor: "#007cfb" }],
};

beforeEach(() => {
  mockTheme = { resolvedTheme: "dark", forcedTheme: undefined };
  // Read shipped dark declarations, so removed/renamed variables cannot be
  // concealed by a getComputedStyle mock returning arbitrary colors.
  postcss
    .parse(readFileSync("styles/portal-theme.css", "utf8"))
    .walkAtRules("variant", (rule) => {
      if (rule.params === "dark")
        rule.walkDecls((decl) => {
          document.documentElement.style.setProperty(decl.prop, decl.value);
        });
    });
});
afterEach(() => document.documentElement.removeAttribute("style"));

describe("canvas theme palette", () => {
  it("resolves shipped dark tokens and restores original options on light/rollback", () => {
    const { rerender } = render(<Chart data={data} />);
    const chart = () => JSON.parse(screen.getByTestId("chart").textContent!);
    expect(chart().options.plugins.tooltip).toMatchObject({
      backgroundColor: "#272727",
      bodyColor: "#9ba3ae",
      titleColor: "#9ba3ae",
      borderColor: "#3c424b",
    });
    expect(chart().options.scales.x.ticks.color).toBe("#9ba3ae");
    expect(chart().data.datasets[0].borderColor).toBe("#66a3ff");
    for (const theme of [
      { resolvedTheme: "light", forcedTheme: undefined },
      { resolvedTheme: "dark", forcedTheme: "light" },
    ]) {
      mockTheme = theme;
      rerender(<Chart data={data} />);
      expect(chart().options.plugins.tooltip.backgroundColor).toBe("#ffffff");
      expect(chart().data.datasets[0].borderColor).toBe("#007cfb");
    }
  });
});
