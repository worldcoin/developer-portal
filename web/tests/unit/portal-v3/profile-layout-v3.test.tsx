/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ProfileLayoutV3 } from "@/scenes/PortalV3/Profile/layout";

describe("ProfileLayoutV3", () => {
  it("renders the account page content with a close-X to the main app (no tabs)", () => {
    render(
      <ProfileLayoutV3>
        <div data-testid="page-body">profile content</div>
      </ProfileLayoutV3>,
    );
    // The v2 account page content renders as-is.
    expect(screen.getByTestId("page-body")).toBeInTheDocument();
    expect(screen.getByTestId("portal-v3-account-shell")).toBeInTheDocument();

    // Close-X returns to the main app; "/" resolves to the team dashboard.
    const close = screen.getByRole("link", { name: /back to/i });
    expect(close).toHaveAttribute("href", "/");

    // No v2 account tabs in this minimal chrome.
    expect(screen.queryByText("Danger zone")).not.toBeInTheDocument();
  });
});
