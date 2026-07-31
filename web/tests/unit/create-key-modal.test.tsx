/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CreateKeyModal } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/CreateKeyModal";

// #region Mocks
const insertKeyMock = jest.fn();
const resetKeyMock = jest.fn();

jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/CreateKeyModal/graphql/client/create-key.generated",
  () => ({ InsertKeyDocument: { __doc: "insert" } }),
);
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated",
  () => ({ ResetApiKeyDocument: { __doc: "reset" } }),
);
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated",
  () => ({ FetchKeysDocument: { __doc: "fetch" } }),
);

jest.mock("@apollo/client/react", () => ({
  useMutation: (document: { __doc?: string }) => [
    document.__doc === "insert" ? insertKeyMock : resetKeyMock,
    { loading: false },
  ],
}));

// `dismissable` is surfaced as an attribute so tests can assert the dialog is
// sealed for exactly as long as an unrecoverable secret is in flight.
jest.mock("@/components/FormDialog", () => ({
  FormDialog: ({
    children,
    open,
    title,
    dismissable = true,
  }: React.PropsWithChildren<{
    open: boolean;
    title: React.ReactNode;
    dismissable?: boolean;
  }>) =>
    open ? (
      <div role="dialog" data-dismissable={String(dismissable)}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
  formDialogErrorClassName: "",
  formDialogInputClassName: "",
  formDialogLabelClassName: "",
  formDialogPrimaryActionClassName: "",
  formDialogSecondaryActionClassName: "",
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretFields",
  () => ({
    ApiKeySecretFields: ({ apiKey }: { apiKey: string }) => (
      <code>{apiKey}</code>
    ),
  }),
);

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const deferred = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const dialog = () => screen.getByRole("dialog");
const cancelButton = () => screen.getByRole("button", { name: /cancel/i });

const submitForm = (name = "production") => {
  fireEvent.change(screen.getByLabelText(/key name/i), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: /create new key/i }));
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  insertKeyMock.mockResolvedValue({
    data: { insert_api_key_one: { id: "key_1" } },
  });
  resetKeyMock.mockResolvedValue({
    data: { reset_api_key: { api_key: "api_NEW_SECRET" } },
  });
});

describe("API key creation flow", () => {
  it("creates a key and reveals its one-time secret", async () => {
    render(<CreateKeyModal teamId="team_1" isOpen setIsOpen={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: "production" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create new key/i }));

    expect(await screen.findByText("api_NEW_SECRET")).toBeInTheDocument();
    expect(insertKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { name: "production", teamId: "team_1" },
      }),
    );
    expect(resetKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: "key_1", team_id: "team_1" },
      }),
    );
  });

  it("stays sealed for the whole two-mutation sequence", async () => {
    // The key exists after the insert but its secret only comes back from the
    // reset, so the gap between them is the dangerous window: both Apollo
    // loading flags read false there, which is why the lock tracks its own state.
    const insert = deferred();
    const reset = deferred();
    insertKeyMock.mockReturnValue(insert.promise);
    resetKeyMock.mockReturnValue(reset.promise);

    render(<CreateKeyModal teamId="team_1" isOpen setIsOpen={jest.fn()} />);
    submitForm();

    await waitFor(() =>
      expect(dialog()).toHaveAttribute("data-dismissable", "false"),
    );
    expect(cancelButton()).toBeDisabled();

    // Insert has landed; the reset is still outstanding.
    await act(async () => {
      insert.resolve({ data: { insert_api_key_one: { id: "key_1" } } });
    });
    expect(dialog()).toHaveAttribute("data-dismissable", "false");
    expect(cancelButton()).toBeDisabled();

    await act(async () => {
      reset.resolve({ data: { reset_api_key: { api_key: "api_NEW_SECRET" } } });
    });

    // Secret revealed, and only now may the user leave.
    expect(await screen.findByText("api_NEW_SECRET")).toBeInTheDocument();
    expect(dialog()).toHaveAttribute("data-dismissable", "true");
  });

  it("unlocks when creation fails so the user is not trapped", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    insertKeyMock.mockRejectedValue(new Error("network error"));

    render(<CreateKeyModal teamId="team_1" isOpen setIsOpen={jest.fn()} />);
    submitForm();

    await waitFor(() =>
      expect(dialog()).toHaveAttribute("data-dismissable", "true"),
    );
    expect(cancelButton()).toBeEnabled();
    expect(screen.queryByText("api_NEW_SECRET")).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
