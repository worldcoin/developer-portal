/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { EntryList } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm/EntryList";
import { normalizeDomainInput } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm/domain-utils";
import { fireEvent, render, screen } from "@testing-library/react";

// #region Test Data
const addressA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const addressB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const makeAddress = (value: number) =>
  `0x${value.toString(16).padStart(40, "0")}`;

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const INVALID_MESSAGE =
  "Enter a valid Worldchain address (0x followed by 40 hex characters).";
const DUPLICATE_MESSAGE = "That address has already been added.";

const renderAddressEntryList = (props?: {
  values?: string[];
  allowCommaSeparated?: boolean;
  normalize?: (value: string) => string;
  validate?: (value: string) => boolean;
}) => {
  const onChange = jest.fn();

  render(
    <EntryList
      values={props?.values ?? []}
      onChange={onChange}
      placeholder="Paste addresses"
      disabled={false}
      validate={props?.validate ?? ((value) => ETH_ADDRESS_REGEX.test(value))}
      invalidMessage={INVALID_MESSAGE}
      duplicateMessage={DUPLICATE_MESSAGE}
      copyFieldName="Address"
      emptyText="No addresses yet."
      allowCommaSeparated={props?.allowCommaSeparated}
      normalize={props?.normalize}
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

  it("drops empty comma segments before normalizing a domain batch", () => {
    const { onChange } = renderAddressEntryList({
      allowCommaSeparated: true,
      normalize: normalizeDomainInput,
      validate: (value) => /^https:\/\//.test(value),
    });

    fireEvent.change(screen.getByPlaceholderText("Paste addresses"), {
      target: { value: "example.com,," },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith(["https://example.com"]);
  });
});
// #endregion

// #region Comma-separated address entry
describe("Mini App permissions address entry", () => {
  it("shows two entries and expands additional entries inline", () => {
    renderAddressEntryList({
      values: [addressA, addressB, makeAddress(3)],
    });

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(2);
    const moreButton = screen.getByRole("button", {
      name: "Show 1 more address entries",
    });

    fireEvent.click(moreButton);

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Show fewer address entries" }),
    ).toHaveTextContent("Show less");

    fireEvent.click(
      screen.getByRole("button", { name: "Show fewer address entries" }),
    );

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(2);
  });

  it("shows two entries directly when the list does not overflow", () => {
    renderAddressEntryList({ values: [addressA, addressB] });

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /more address entries/ }),
    ).not.toBeInTheDocument();
  });

  it("reveals very large lists in batches of ten", () => {
    renderAddressEntryList({
      values: Array.from({ length: 13 }, (_, index) => makeAddress(index + 1)),
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show 10 more address entries" }),
    );

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(12);
    expect(
      screen.getByRole("button", { name: "Show 1 more address entries" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show 1 more address entries" }),
    );

    expect(screen.getAllByTestId("entry-list-visible-row")).toHaveLength(13);
    expect(
      screen.queryByRole("button", { name: /Show \d+ more address entries/ }),
    ).not.toBeInTheDocument();
  });

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
