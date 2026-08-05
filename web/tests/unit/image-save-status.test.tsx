/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useEffect } from "react";
import {
  SaveStatusIndicator,
  SaveStatusProvider,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/SaveStatus";
import { useImageSaveStatus } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/use-image-save-status";

/**
 * Uses the real provider and indicator rather than mocking the context: what
 * matters is what the *shared* pill shows once an image field's status is
 * merged with everyone else's.
 */

type Report = "saving" | "saved" | "error" | "idle" | null;

const retrySpy = jest.fn();

const ImageField = ({
  id = "image:showcase:fr",
  report,
}: {
  id?: string;
  report: Report;
}) => {
  const { reportSaving, reportSaved, reportError, reportIdle } =
    useImageSaveStatus(id);

  useEffect(() => {
    if (report === "saving") reportSaving();
    if (report === "saved") reportSaved();
    if (report === "idle") reportIdle();
    if (report === "error") {
      reportError(new Error("network down"), retrySpy);
    }
  }, [report, reportSaving, reportSaved, reportError, reportIdle]);

  return null;
};

const renderWithProvider = (ui: React.ReactNode) =>
  render(
    <SaveStatusProvider>
      <SaveStatusIndicator />
      {ui}
    </SaveStatusProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useImageSaveStatus", () => {
  it("drives the shared pill instead of raising its own notification", () => {
    renderWithProvider(<ImageField report="saving" />);

    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("shows a single 'Changes saved' for a completed image save", () => {
    renderWithProvider(<ImageField report="saved" />);

    expect(screen.getByText("Changes saved")).toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("offers Retry when the save fails after the file already uploaded", () => {
    renderWithProvider(<ImageField report="error" />);

    expect(screen.getByText("Couldn't save")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Retry"));
    expect(retrySpy).toHaveBeenCalledTimes(1);
  });
});

describe("useImageSaveStatus cleanup", () => {
  it("releases the pill when the field unmounts mid-save", () => {
    // A leaked "saving" entry outranks every other state in mergeStatuses and
    // would pin the pill for the rest of the session. Reachable in practice:
    // the form provider is keyed on metadata id + view mode and remounts
    // during a version switch.
    const { rerender } = renderWithProvider(<ImageField report="saving" />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();

    rerender(
      <SaveStatusProvider>
        <SaveStatusIndicator />
      </SaveStatusProvider>,
    );

    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("releases the pill when the field switches locale mid-save", () => {
    // Same hazard, different route: the id is per locale, so switching
    // language abandons the previous id's entry rather than unmounting.
    const { rerender } = renderWithProvider(
      <ImageField id="image:showcase:fr" report="saving" />,
    );
    expect(screen.getByText("Saving…")).toBeInTheDocument();

    rerender(
      <SaveStatusProvider>
        <SaveStatusIndicator />
        <ImageField id="image:showcase:de" report="idle" />
      </SaveStatusProvider>,
    );

    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("does not throw when rendered outside a SaveStatusProvider", () => {
    // The legacy configuration page renders these fields without the wizard's
    // provider, so reporting status must degrade to a no-op.
    expect(() => render(<ImageField report="saving" />)).not.toThrow();
  });
});
