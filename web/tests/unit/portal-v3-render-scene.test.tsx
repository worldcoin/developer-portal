/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  pickPortalComponent,
  renderPortalScene,
} from "@/lib/feature-flags/portal-v3";

const V2 = (props: { label?: string }) => <div>v2 {props.label}</div>;
const V3 = (props: { label?: string }) => <div>v3 {props.label}</div>;

describe("portal v3 scene chooser", () => {
  afterEach(() => {
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
  });

  it("renders v2 when the flag is off", () => {
    const Chosen = renderPortalScene(V2, V3);
    render(<Chosen label="dashboard" />);
    expect(screen.getByText("v2 dashboard")).toBeInTheDocument();
  });

  it("renders v3 when the flag is on", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    const Chosen = renderPortalScene(V2, V3);
    render(<Chosen label="dashboard" />);
    expect(screen.getByText("v3 dashboard")).toBeInTheDocument();
  });

  it("falls back to v2 when the v3 component is null", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    const Chosen = renderPortalScene(V2, null);
    render(<Chosen label="actions" />);
    expect(screen.getByText("v2 actions")).toBeInTheDocument();
  });

  it("returns the chosen component for async shims", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    expect(pickPortalComponent(V2, V3)).toBe(V3);
    expect(pickPortalComponent(V2, null)).toBe(V2);
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    expect(pickPortalComponent(V2, V3)).toBe(V2);
  });
});
