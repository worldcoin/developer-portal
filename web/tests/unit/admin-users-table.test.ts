import {
  parseUserColumnVisibility,
  serializeUserColumnVisibility,
} from "@/components/AdminDashboard/Users/column-visibility";
import {
  clampUsersPage,
  getUsersTotalPages,
  parseUsersLimit,
  parseUsersPage,
} from "@/components/AdminDashboard/Users/pagination";
import { parseUsersSearchTokens } from "@/components/AdminDashboard/Users/search";
import {
  getNextUsersSort,
  parseUsersSort,
  serializeUsersSort,
} from "@/components/AdminDashboard/Users/sorting";
import { getPaginationSlots } from "@/components/AdminDashboard/common/ListPagination";

describe("admin users table URL state", () => {
  it("keeps the required name column visible", () => {
    const visibility = parseUserColumnVisibility("email,teamsCount");

    expect(visibility).toEqual({
      name: true,
      email: true,
      teamsCount: true,
      createdAt: false,
    });
    expect(serializeUserColumnVisibility(visibility)).toBe(
      "name,email,teamsCount",
    );
  });

  it("accepts only supported limits and positive pages", () => {
    expect(parseUsersLimit("50")).toBe(50);
    expect(parseUsersLimit("20")).toBe(25);
    expect(parseUsersPage("3")).toBe(3);
    expect(parseUsersPage("0")).toBe(1);
  });

  it("parses field filters and quoted plain searches", () => {
    expect(
      parseUsersSearchTokens('email:example.com teams>=2 "Jane Doe"'),
    ).toEqual([
      { type: "field", field: "email", operator: ":", value: "example.com" },
      { type: "field", field: "teams", operator: ">=", value: "2" },
      { type: "plain", value: "Jane Doe" },
    ]);
  });

  it("normalizes field aliases before parsing", () => {
    expect(parseUsersSearchTokens('NAME:"Jane Doe"')).toEqual([
      { type: "field", field: "name", operator: ":", value: "Jane Doe" },
    ]);
  });

  it("cycles sorting from descending to ascending to default", () => {
    const initial = parseUsersSort("email:desc");

    expect(initial).toEqual({ field: "email", direction: "desc" });
    expect(getNextUsersSort(initial, "email")).toEqual({
      field: "email",
      direction: "asc",
    });
    expect(
      getNextUsersSort({ field: "email", direction: "asc" }, "email"),
    ).toBeNull();
    expect(serializeUsersSort({ field: "createdAt", direction: "desc" })).toBe(
      "createdAt:desc",
    );
  });

  it("clamps pagination to the available range", () => {
    expect(getUsersTotalPages(51, 25)).toBe(3);
    expect(clampUsersPage(10, 3)).toBe(3);
  });

  it("uses shared pagination slots around the current page", () => {
    expect(getPaginationSlots(6, 12)).toEqual([1, "start", 5, 6, 7, "end", 12]);
  });
});
