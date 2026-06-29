/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
jest.mock("server-only", () => ({}));

const isPortalV3Enabled = jest.fn<boolean, []>();
jest.mock("@/lib/feature-flags/portal-v3/flag", () => ({
  isPortalV3Enabled: () => isPortalV3Enabled(),
}));
// #endregion

import {
  pickPortalComponent,
  renderPortalScene,
} from "@/lib/feature-flags/portal-v3/render-portal-scene";

type Props = { label: string };
const V2 = ({ label }: Props) => <div data-testid="v2">{`v2:${label}`}</div>;
const V3 = ({ label }: Props) => <div data-testid="v3">{`v3:${label}`}</div>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pickPortalComponent", () => {
  it("returns V2 when the flag is off", () => {
    isPortalV3Enabled.mockReturnValue(false);
    expect(pickPortalComponent(V2, V3)).toBe(V2);
  });

  it("returns V3 when the flag is on and a V3 component exists", () => {
    isPortalV3Enabled.mockReturnValue(true);
    expect(pickPortalComponent(V2, V3)).toBe(V3);
  });

  it("returns V2 when the flag is on but V3 is null (v2-compat shim)", () => {
    isPortalV3Enabled.mockReturnValue(true);
    expect(pickPortalComponent(V2, null)).toBe(V2);
  });
});

describe("renderPortalScene", () => {
  it("renders V2 when the flag is off", () => {
    isPortalV3Enabled.mockReturnValue(false);
    const Scene = renderPortalScene(V2, V3);
    render(<Scene label="x" />);
    expect(screen.getByTestId("v2")).toHaveTextContent("v2:x");
    expect(screen.queryByTestId("v3")).not.toBeInTheDocument();
  });

  it("renders V3 when the flag is on", () => {
    isPortalV3Enabled.mockReturnValue(true);
    const Scene = renderPortalScene(V2, V3);
    render(<Scene label="y" />);
    expect(screen.getByTestId("v3")).toHaveTextContent("v3:y");
    expect(screen.queryByTestId("v2")).not.toBeInTheDocument();
  });

  it("renders V2 when V3 is null even if the flag is on", () => {
    isPortalV3Enabled.mockReturnValue(true);
    const Scene = renderPortalScene(V2, null);
    render(<Scene label="z" />);
    expect(screen.getByTestId("v2")).toHaveTextContent("v2:z");
  });
});
