/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

// #region Verification gate
describe("DeleteConfirmationDialog [verification word]", () => {
  it("keeps the confirm button locked until the word matches", async () => {
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open
        onClose={jest.fn()}
        onConfirm={onConfirm}
        confirmationWord="Delete"
        title="Do you want to delete this app?"
        description="It will be gone."
      />,
    );

    const confirm = screen.getByRole("button", { name: "Yes" });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "delete this" },
    });
    await waitFor(() => expect(confirm).toBeDisabled());

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "delete" },
    });
    await waitFor(() => expect(confirm).toBeEnabled());

    fireEvent.click(confirm);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("re-locks the confirm button after the dialog closes", async () => {
    const Harness = () => {
      const [open, setOpen] = React.useState(true);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            reopen
          </button>

          <DeleteConfirmationDialog
            open={open}
            onClose={() => setOpen(false)}
            onConfirm={jest.fn()}
            confirmationWord="Delete"
            title="Do you want to delete this app?"
            description="It will be gone."
          />
        </>
      );
    };

    render(<Harness />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Delete" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Yes" }),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "reopen" }));

    // Without the reset the word survives in form state and a second delete is
    // one click away.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled(),
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("confirms without a verification step when no word is required", () => {
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationDialog
        open
        onClose={jest.fn()}
        onConfirm={onConfirm}
        title="Do you want to leave this team?"
        description="You can be invited back."
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Yes" });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both actions while the caller's mutation is in flight", () => {
    render(
      <DeleteConfirmationDialog
        open
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        loading
        title="Do you want to delete this app?"
        description="It will be gone."
      />,
    );

    expect(screen.getByRole("button", { name: "No" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled();
  });
});
// #endregion
