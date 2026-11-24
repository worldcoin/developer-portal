/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

import { AdminAppActionsSection } from "@/scenes/Admin/apps/id/ActionsSection";

describe("admin app actions section", () => {
  it("renders legacy and World ID 4.0 snapshot metrics", () => {
    render(
      <AdminAppActionsSection
        legacyActions={[
          {
            action: "claim-offer",
            createdAt: "2026-01-04T10:00:00Z",
            id: "action_claim",
            name: "Claim offer",
            status: "active",
            totalUses: 12345,
            uniqueNullifiers: 12000,
          },
          {
            action: "",
            createdAt: "2026-01-01T10:00:00Z",
            id: "action_sign_in",
            name: "",
            status: "active",
            totalUses: 0,
            uniqueNullifiers: 0,
          },
        ]}
        worldId40Actions={[
          {
            action: "check-human",
            createdAt: "2026-01-05T10:00:00Z",
            environment: "staging",
            id: "action_v4_check_human",
            recordedUniqueUses: 42,
            rpId: "rp_1111111111111111",
          },
        ]}
      />,
    );

    const legacyTable = screen.getByRole("table", {
      name: "Legacy actions usage",
    });
    const claimRow = within(legacyTable).getByRole("row", {
      name: /Claim offer/,
    });
    const signInRow = within(legacyTable).getByRole("row", {
      name: /Sign in with World ID/,
    });
    const worldId40Table = screen.getByRole("table", {
      name: "World ID 4.0 actions usage",
    });

    expect(within(claimRow).getByText("12,345")).toBeVisible();
    expect(within(claimRow).getByText("12,000")).toBeVisible();
    expect(within(signInRow).getByText("(empty action value)")).toBeVisible();
    expect(within(worldId40Table).getByText("staging")).toBeVisible();
    expect(within(worldId40Table).getByText("42")).toBeVisible();
    expect(screen.getByText(/not filtered by claim date/i)).toBeVisible();
  });

  it("renders explicit empty states", () => {
    render(<AdminAppActionsSection legacyActions={[]} worldId40Actions={[]} />);

    expect(screen.getByText("No legacy actions.")).toBeVisible();
    expect(screen.getByText("No World ID 4.0 actions.")).toBeVisible();
  });
});
