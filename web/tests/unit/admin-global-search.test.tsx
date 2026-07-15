/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { Search } from "@/components/AdminDashboard/Search";

const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  global.fetch = mockFetch;
});

afterEach(() => {
  jest.useRealTimers();
});

const searchInput = () => screen.getByRole("combobox");

describe("admin global search", () => {
  it.each([
    ["Command", { key: "k", metaKey: true }],
    ["Control", { ctrlKey: true, key: "k" }],
  ])("focuses the input with %s + K", (_label, shortcut) => {
    render(<Search />);

    fireEvent.keyDown(window, shortcut);

    expect(searchInput()).toHaveFocus();
  });

  it("waits for the debounce period then displays grouped results", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        apps: [
          {
            id: "app_current",
            name: "Current app",
            teamId: "team_current",
          },
        ],
        teams: [{ id: "team_current", name: "Current team" }],
        users: [],
      }),
      ok: true,
    });

    render(<Search />);
    fireEvent.focus(searchInput());
    fireEvent.change(searchInput(), { target: { value: "current" } });

    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/search?q=current",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByRole("option", { name: /Current team/i })).toBeVisible();
    expect(screen.getByRole("option", { name: /Current app/i })).toBeVisible();
  });

  it("navigates to the keyboard-selected result", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        apps: [
          { id: "app_current", name: "Current app", teamId: "team_current" },
        ],
        teams: [],
        users: [],
      }),
      ok: true,
    });

    render(<Search />);
    fireEvent.focus(searchInput());
    fireEvent.change(searchInput(), { target: { value: "current" } });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
    fireEvent.keyDown(searchInput(), { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/admin/apps/app_current");
  });

  it("clears a selected result before debouncing a changed query", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        apps: [
          { id: "app_current", name: "Current app", teamId: "team_current" },
        ],
        teams: [],
        users: [],
      }),
      ok: true,
    });

    render(<Search />);
    fireEvent.focus(searchInput());
    fireEvent.change(searchInput(), { target: { value: "current" } });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
    fireEvent.change(searchInput(), { target: { value: "next" } });
    fireEvent.keyDown(searchInput(), { key: "Enter" });

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByRole("option", { name: /Current app/i })).toBeNull();
  });

  it("aborts an outstanding request when the query changes", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<Search />);
    fireEvent.focus(searchInput());
    fireEvent.change(searchInput(), { target: { value: "first" } });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    const firstSignal = mockFetch.mock.calls[0][1].signal as AbortSignal;

    fireEvent.change(searchInput(), { target: { value: "second" } });

    expect(firstSignal.aborted).toBe(true);
  });
});
