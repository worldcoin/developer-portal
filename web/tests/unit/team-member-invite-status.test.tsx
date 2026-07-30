/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Role_Enum } from "@/graphql/graphql";
import { Item } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/Members/List/Item";
import type { FetchTeamMembersQuery } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";

// #region Mocks
// Item only needs the nullifier fallback. Loading the full utility module pulls
// IDKit into jsdom, where TextEncoder is unavailable.
jest.mock("@/lib/utils", () => ({
  getNullifierName: (nullifier?: string | null) => nullifier ?? "",
}));
// #endregion

// #region Test Data
const makeItem = (id: string): FetchTeamMembersQuery["members"][number] => ({
  __typename: "membership",
  id,
  role: Role_Enum.Member,
  user: {
    __typename: "user",
    id: "usr_123",
    name: "Member name",
    email: "member@example.com",
    world_id_nullifier: null,
  },
});
// #endregion

// #region Access status
describe("Team member row [access status]", () => {
  it("renders an unaccepted invitation as pending rather than member", () => {
    render(<Item item={makeItem("inv_123")} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("Member")).not.toBeInTheDocument();
  });

  it("retains the role label for an accepted member", () => {
    render(<Item item={makeItem("memb_123")} />);

    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });
});
// #endregion
