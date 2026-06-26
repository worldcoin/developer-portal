/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/teams/team_1/apps/app_1",
  useParams: () => ({ teamId: "team_1", appId: "app_1" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  redirect: jest.fn(),
}));

jest.mock("@/scenes/PortalV3/Shell/AppSwitcherContainer", () => ({
  AppSwitcherContainer: () => null,
}));
// #endregion

import { V3Shell } from "@/scenes/PortalV3/Shell";

// V3Shell is an async server component — call it directly and render the JSX.
async function renderShell(children: React.ReactNode) {
  const jsx = await V3Shell({ teamId: "team_1", children });
  return render(jsx);
}

// Minimal session with a team membership so the shell renders without redirecting.
const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
    hasura: {
      memberships: [{ team: { id: "team_1", name: "Team One" } }],
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(mockSession);
});

describe("V3Shell", () => {
  it("renders its children in the content area", async () => {
    const { getByTestId } = await renderShell(
      <div data-testid="content">hello</div>,
    );
    expect(getByTestId("content")).toHaveTextContent("hello");
  });

  it("composes the sidebar nav (app-scope + team-scope groups)", async () => {
    await renderShell("x");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("World ID")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });
});
