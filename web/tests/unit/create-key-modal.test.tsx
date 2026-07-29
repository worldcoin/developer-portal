/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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

jest.mock("@/components/FormDialog", () => ({
  FormDialog: ({
    children,
    open,
    title,
  }: React.PropsWithChildren<{ open: boolean; title: React.ReactNode }>) =>
    open ? (
      <div role="dialog">
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
});
