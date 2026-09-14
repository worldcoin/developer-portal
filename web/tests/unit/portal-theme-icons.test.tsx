/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { Icon, getIconPath } from "@/scenes/PortalV3/common/Icon";

// #region Theme-aware icons
describe("portal icon rendering", () => {
  it("provides a currentColor mask for monochrome icons while retaining the original light asset", () => {
    const { container } = render(
      <Icon name="nav-help" className="size-4 text-portal-muted" />,
    );
    const mask = container.querySelector(
      '[data-portal-icon="nav-help"]',
    ) as HTMLElement;
    expect(mask).toHaveClass(
      "portal-monochrome-icon",
      "size-4",
      "text-portal-muted",
    );
    expect(mask.style.getPropertyValue("--portal-icon-mask")).toBe(
      'url("/images/portal-v3/icons/nav-help.svg")',
    );
    expect(mask.querySelector("img")).toHaveAttribute(
      "src",
      "/images/portal-v3/icons/nav-help.svg",
    );
    expect(mask).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    "world-id-sandbox-app-icon",
    "radio-check",
    "warning-triangle",
    "card-wand",
  ])("does not recolor fixed artwork %s", (name) => {
    const { container } = render(<Icon name={name} className="size-4" />);
    expect(container.querySelector("[data-portal-icon]")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      getIconPath(name),
    );
  });

  it("encodes names so an unexpected icon name cannot escape the asset directory", () => {
    expect(getIconPath('../other?name="x"')).toBe(
      "/images/portal-v3/icons/..%2Fother%3Fname%3D%22x%22.svg",
    );
  });
});
// #endregion
