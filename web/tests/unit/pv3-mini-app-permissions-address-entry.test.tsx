/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { EntryList } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm/EntryList";
import { normalizeDomainInput } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm/domain-utils";
import { fireEvent, render, screen } from "@testing-library/react";

// #region Test Data
const addressA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const addressB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const INVALID_MESSAGE =
  "Enter a valid Worldchain address (0x followed by 40 hex characters).";
const DUPLICATE_MESSAGE = "That address has already been added.";

const renderAddressEntryList = (props?: {
  values?: string[];
  allowCommaSeparated?: boolean;
}) => {
  const onChange = jest.fn();

  render(
    <EntryList
      values={props?.values ?? []}
      onChange={onChange}
      placeholder="Paste addresses"
      disabled={false}
      validate={(value) => ETH_ADDRESS_REGEX.test(value)}
      invalidMessage={INVALID_MESSAGE}
      duplicateMessage={DUPLICATE_MESSAGE}
      copyFieldName="Address"
      emptyText="No addresses yet."
      allowCommaSeparated={props?.allowCommaSeparated}
    />,
  );

  return { onChange };
};
// #endregion

// #region Domain normalization
describe("Mini App permissions domain entry", () => {
  it("adds HTTPS to a bare domain", () => {
    expect(normalizeDomainInput("xxyz.com")).toBe("https://xxyz.com");
    expect(normalizeDomainInput("  ssd.xyz  ")).toBe("https://ssd.xyz");
  });

  it("preserves an explicit protocol", () => {
    expect(normalizeDomainInput("https://example.com")).toBe(
      "https://example.com",
    );
  });
});
// #endregion

// #region Comma-separated address entry
describe("Mini App permissions address entry", () => {
  it("adds each comma-separated address as a separate list value", () => {
    const { onChange } = renderAddressEntryList({
      values: [addressA],
      allowCommaSeparated: true,
    });

    fireEvent.change(screen.getByPlaceholderText("Paste addresses"), {
      target: {
        value: `${addressB}, 0x3333333333333333333333333333333333333333`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith([
      addressA,
      addressB,
      "0x3333333333333333333333333333333333333333",
    ]);
    expect(screen.getByPlaceholderText("Paste addresses")).toHaveValue("");
  });

  it("rejects the whole batch when any address is invalid", () => {
    const { onChange } = renderAddressEntryList({
      allowCommaSeparated: true,
    });

    fireEvent.change(screen.getByPlaceholderText("Paste addresses"), {
      target: { value: `${addressA}, not-an-address` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(INVALID_MESSAGE)).toBeInTheDocument();
  });

  it("rejects duplicate addresses within a batch", () => {
    const { onChange } = renderAddressEntryList({
      allowCommaSeparated: true,
    });

    fireEvent.change(screen.getByPlaceholderText("Paste addresses"), {
      target: {
        value: `${addressA}, 0x${addressA.slice(2).toUpperCase()}`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(DUPLICATE_MESSAGE)).toBeInTheDocument();
  });

  it("keeps comma-separated input disabled by default", () => {
    const { onChange } = renderAddressEntryList();

    fireEvent.change(screen.getByPlaceholderText("Paste addresses"), {
      target: { value: `${addressA}, ${addressB}` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(INVALID_MESSAGE)).toBeInTheDocument();
  });
});
// #endregion
