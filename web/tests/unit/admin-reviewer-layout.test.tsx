/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockGetAdminUser = jest.fn();
const mockReviewerFlag = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  getAdminUser: () => mockGetAdminUser(),
  isAdminReviewerPortalEnabled: () => mockReviewerFlag(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

jest.mock("@/components/AdminDashboard/Search", () => ({
  Search: () => null,
}));

import { AdminLayout } from "@/scenes/Admin/layout";

const renderLayout = async () => {
  const layout = await AdminLayout({ children: <p>Admin content</p> });
  return render(layout);
};

describe("admin reviewer navigation authentication", () => {
  beforeEach(() => {
    mockGetAdminUser.mockReset();
    mockReviewerFlag.mockReset();
    mockReviewerFlag.mockReturnValue(true);
  });

  it("hides the Reviewer navigation link without an authenticated admin", async () => {
    mockGetAdminUser.mockResolvedValue(null);

    await renderLayout();

    expect(
      screen.queryByRole("link", { name: "Reviewer" }),
    ).not.toBeInTheDocument();
  });

  it("shows the Reviewer navigation link to an authenticated admin", async () => {
    mockGetAdminUser.mockResolvedValue({
      accessLevel: "read",
      email: "reader@example.com",
      role: "internal_dashboard_readonly",
      subject: "reader-subject",
    });

    await renderLayout();

    expect(screen.getByRole("link", { name: "Reviewer" })).toHaveAttribute(
      "href",
      "/admin/reviewer",
    );
  });

  it("hides the Reviewer navigation link when the staging flag is disabled", async () => {
    mockGetAdminUser.mockResolvedValue({
      accessLevel: "read",
      email: "reader@example.com",
      role: "internal_dashboard_readonly",
      subject: "reader-subject",
    });
    mockReviewerFlag.mockReturnValue(false);

    await renderLayout();

    expect(
      screen.queryByRole("link", { name: "Reviewer" }),
    ).not.toBeInTheDocument();
  });
});
