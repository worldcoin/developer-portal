/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { toast } from "react-toastify";

import { UpdateActionV4Form } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/UpdateActionV4Form";
import { updateActionV4ServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/UpdateActionV4Form/server";
import { DeleteAction } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/DeleteAction";

const mockRouterPush = jest.fn();
const mockCacheIdentify = jest.fn();
const mockCacheEvict = jest.fn();
const mockCacheGc = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    cache: {
      identify: mockCacheIdentify,
      evict: mockCacheEvict,
      gc: mockCacheGc,
    },
  }),
}));

jest.mock("@/lib/utils", () => ({
  truncateString: (value: string) => value,
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/UpdateActionV4Form/server",
  () => ({
    updateActionV4ServerSide: jest.fn(),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/DeleteAction/server",
  () => ({ deleteActionV4ServerSide: jest.fn() }),
);

const mockUpdateAction = jest.mocked(updateActionV4ServerSide);
const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);

const action = {
  id: "action-id",
  action: "community-vote",
  description: "Vote in community polls",
};

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Editable action details
describe("World ID action details [description autosave]", () => {
  it("keeps the identifier immutable and autosaves the editable description on blur", async () => {
    const onUpdated = jest.fn();
    mockUpdateAction.mockResolvedValue({
      success: true,
      message: "Action settings updated successfully",
    });

    render(
      <UpdateActionV4Form
        action={action}
        appId="app_123"
        canModify
        onUpdated={onUpdated}
      />,
    );

    const identifier = screen.getByLabelText("Action identifier");
    expect(identifier).toHaveAttribute("readonly");
    expect(identifier.closest("label")).toHaveClass(
      "h-14",
      "border",
      "rounded-[10px]",
      "border-portal-border",
      "bg-portal-canvas",
    );
    expect(
      screen.getByRole("button", { name: "Copy Action identifier" }),
    ).toBeEnabled();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();

    const description = screen.getByLabelText("Short description");
    expect(description).not.toHaveAttribute("readonly");
    expect(description).toBeEnabled();
    expect(description.closest("label")).toHaveClass(
      "h-14",
      "border",
      "rounded-[10px]",
      "border-portal-border",
      "bg-white",
    );
    const fields = identifier.closest("label")?.parentElement?.parentElement;
    expect(fields).toHaveClass("flex", "flex-col", "gap-4");
    expect(fields).not.toHaveClass("rounded-16", "border", "bg-white", "p-5");

    expect(
      screen.queryByRole("button", { name: "Edit short description" }),
    ).toBeNull();

    fireEvent.change(description, {
      target: { value: "Vote on community grants" },
    });
    fireEvent.blur(description);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith(
        {
          action: "community-vote",
          description: "Vote on community grants",
        },
        "action-id",
        "app_123",
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Action description updated");
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(description).toBeEnabled();
  });

  it("keeps the field editable and shows an error toast when autosave fails", async () => {
    mockUpdateAction.mockResolvedValue({
      success: false,
      message: "Failed to update action settings",
    });

    render(<UpdateActionV4Form action={action} appId="app_123" canModify />);

    const description = screen.getByLabelText("Short description");
    fireEvent.change(description, { target: { value: "A new description" } });
    fireEvent.blur(description);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to update action settings",
      );
    });
    expect(description).toBeEnabled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("autosaves after the Get verified debounce without requiring blur", async () => {
    jest.useFakeTimers();
    try {
      mockUpdateAction.mockResolvedValue({
        success: true,
        message: "Action settings updated successfully",
      });

      render(<UpdateActionV4Form action={action} appId="app_123" canModify />);

      fireEvent.change(screen.getByLabelText("Short description"), {
        target: { value: "Automatically saved description" },
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1500);
      });

      expect(mockUpdateAction).toHaveBeenCalledWith(
        {
          action: "community-vote",
          description: "Automatically saved description",
        },
        "action-id",
        "app_123",
      );
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Action description updated",
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
// #endregion

// #region Destructive action card
describe("World ID action details [deletion]", () => {
  it("uses the same compact danger card pattern as World ID Configuration", () => {
    render(
      <DeleteAction
        action={action}
        teamId="team_123"
        appId="app_123"
        canModify
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Delete this action" }),
    ).toBeInTheDocument();
    expect(screen.getByText("community-vote")).toHaveClass("text-grey-900");
    expect(screen.getByRole("button", { name: "Delete action" })).toBeEnabled();
  });
});
// #endregion

// #region Read-only action details
describe("World ID action details [read-only]", () => {
  it("does not expose description editing without modify permission", () => {
    render(
      <UpdateActionV4Form action={action} appId="app_123" canModify={false} />,
    );

    expect(screen.getByLabelText("Short description")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Edit short description" }),
    ).toBeNull();
    expect(mockUpdateAction).not.toHaveBeenCalled();
  });
});
// #endregion
