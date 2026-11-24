/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const replace = jest.fn();
let searchParams = new URLSearchParams("membersPage=1");

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/teams/team_current",
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

import {
  AdminSearchParamsController,
  useAdminSearchParamsPatch,
} from "@/components/AdminDashboard/common/SearchParamsController";

const Controls = () => {
  const patchSearchParams = useAdminSearchParamsPatch();

  return (
    <>
      <button
        onClick={() => patchSearchParams({ appsPage: "2" })}
        type="button"
      >
        Load apps
      </button>
      <button
        onClick={() => patchSearchParams({ membersPage: "2" })}
        type="button"
      >
        Load members
      </button>
    </>
  );
};

describe("admin search parameter controller", () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams("membersPage=1");
  });

  it("merges concurrent patches into one navigation", async () => {
    render(
      <AdminSearchParamsController>
        <Controls />
      </AdminSearchParamsController>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load apps" }));
    fireEvent.click(screen.getByRole("button", { name: "Load members" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      "/admin/teams/team_current?membersPage=2&appsPage=2",
      { scroll: false },
    );
  });
});
