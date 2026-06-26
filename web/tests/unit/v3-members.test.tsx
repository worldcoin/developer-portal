/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MembersView } from "@/scenes/PortalV3/Members/MembersView";

describe("MembersView", () => {
  it("renders members with their roles and an invite action", () => {
    render(
      <MembersView
        members={[
          { name: "Soam Desai", email: "soam@example.com", role: "Owner" },
          { name: "Ada Lovelace", email: "ada@example.com", role: "Admin" },
        ]}
      />,
    );
    expect(screen.getByText("Soam Desai")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invite" }),
    ).toBeInTheDocument();
  });
});
