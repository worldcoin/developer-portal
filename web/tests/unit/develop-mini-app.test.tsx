/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { Suspense } from "react";
import { DevelopMiniApp } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/DevelopMiniApp";

// #region Mocks
const mockUseFetchAppMetadataQuery = jest.fn();
const mockUpdateIntegrationUrl = jest.fn();
const mockRefetch = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    useFetchAppMetadataQuery: () => mockUseFetchAppMetadataQuery(),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/DevelopMiniApp/graphql/client/update-integration-url.generated",
  () => ({
    useUpdateIntegrationUrlMutation: () => [
      mockUpdateIntegrationUrl,
      { loading: false },
    ],
  }),
);

// Leaf UI components mocked to simple, assertable stand-ins — the branching
// logic in DevelopMiniApp is the thing under test.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/QrQuickAction",
  () => ({
    QrQuickAction: ({
      url,
      showDraftMiniAppFlag,
    }: {
      url: string;
      showDraftMiniAppFlag: boolean;
    }) => (
      <div
        data-testid="qr"
        data-url={url}
        data-flag={String(showDraftMiniAppFlag)}
      />
    ),
  }),
);

jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/SubTabs", () => ({
  MiniAppSubTabs: () => null,
}));

jest.mock("@/components/FloatingInput", () => ({
  FloatingInput: ({
    id,
    label,
    value,
    onChange,
    onBlur,
    disabled,
    readOnly,
  }: any) => (
    <input
      data-testid={id}
      aria-label={label}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
    />
  ),
}));

jest.mock("@/components/DecoratedButton", () => ({
  DecoratedButton: ({ children, disabled, onClick, type }: any) => (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-testid="save-btn"
    >
      {children}
    </button>
  ),
}));

jest.mock("@/lib/schema", () => ({ inferHttps: (v: string) => v }));

jest.mock("react-toastify", () => ({
  toast: {
    success: (...a: unknown[]) => mockToastSuccess(...a),
    error: (...a: unknown[]) => mockToastError(...a),
  },
}));
// #endregion

// #region Test Data
const APP_ID = "app_0123456789abcdef0123456789abcdef";
const DRAFT_ID = "meta_draft_0001";
const VERIFIED_ID = "meta_verified_0001";

type Row = {
  id: string;
  app_mode: string;
  verification_status: string;
  integration_url: string;
};

const makeRow = (overrides: Partial<Row> = {}): Row => ({
  id: DRAFT_ID,
  app_mode: "mini-app",
  verification_status: "unverified",
  integration_url: "https://staging.example.com",
  ...overrides,
});

const setMetadata = (opts: { draft?: Row | null; verified?: Row | null }) => {
  mockUpdateIntegrationUrl.mockResolvedValue({});
  mockRefetch.mockResolvedValue({});
  mockUseFetchAppMetadataQuery.mockReturnValue({
    loading: false,
    error: undefined,
    refetch: mockRefetch,
    data: {
      app: [
        {
          app_metadata: opts.draft ? [opts.draft] : [],
          verified_app_metadata: opts.verified ? [opts.verified] : [],
        },
      ],
    },
  });
};

// The scene reads its params via React's `use(params)`. In a test we hand it an
// already-fulfilled thenable (status/value pre-set) so `use` returns
// synchronously instead of suspending — no Suspense retry timing to manage.
const fulfilledParams = () => {
  const params: any = Promise.resolve({ appId: APP_ID });
  params.status = "fulfilled";
  params.value = { appId: APP_ID };
  return params;
};

const renderScene = () => {
  render(
    <Suspense fallback={<div>loading</div>}>
      <DevelopMiniApp params={fulfilledParams()} />
    </Suspense>,
  );
  screen.getByText("Develop your mini app");
};

const qrByFlag = (flag: "true" | "false") =>
  screen
    .getAllByTestId("qr")
    .find((el) => el.getAttribute("data-flag") === flag);
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Draft (unverified) — editable + dev QR via draft_id
describe("DevelopMiniApp [unverified draft]", () => {
  it("shows an editable App URL, a Save button, and a dev QR scoped by draft_id", async () => {
    setMetadata({ draft: makeRow() });
    await renderScene();

    const input = screen.getByTestId("dev_app_url") as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(input.value).toBe("https://staging.example.com");
    expect(screen.getByTestId("save-btn")).toBeInTheDocument();

    const qr = screen.getByTestId("qr");
    expect(qr.getAttribute("data-url")).toContain(`app_id=${APP_ID}`);
    expect(qr.getAttribute("data-url")).toContain(`draft_id=${DRAFT_ID}`);
    expect(qr.getAttribute("data-flag")).toBe("true");
  });

  it("saves to the draft row's integration_url and refetches", async () => {
    setMetadata({ draft: makeRow() });
    await renderScene();

    const input = screen.getByTestId("dev_app_url");
    fireEvent.change(input, {
      target: { value: "https://new-staging.example.com" },
    });

    const saveBtn = screen.getByTestId("save-btn") as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(mockUpdateIntegrationUrl).toHaveBeenCalledWith({
        variables: {
          id: DRAFT_ID,
          integration_url: "https://new-staging.example.com",
        },
      }),
    );
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("keeps Save disabled when the URL is unchanged", async () => {
    setMetadata({ draft: makeRow() });
    await renderScene();

    expect((screen.getByTestId("save-btn") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows a warning and no QR when the saved URL is empty/invalid", async () => {
    setMetadata({ draft: makeRow({ integration_url: "" }) });
    await renderScene();

    expect(
      screen.getByText(/Save a valid App URL to generate the QR/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("qr")).not.toBeInTheDocument();
  });
});
// #endregion

// #region Submitted (awaiting_review) — locked
describe("DevelopMiniApp [awaiting_review]", () => {
  it("makes the field read-only, hides Save, and still previews via draft_id", async () => {
    setMetadata({
      draft: makeRow({ verification_status: "awaiting_review" }),
    });
    await renderScene();

    const input = screen.getByTestId("dev_app_url") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(screen.queryByTestId("save-btn")).not.toBeInTheDocument();
    expect(screen.getByText(/under review/i)).toBeInTheDocument();
    expect(screen.getByTestId("qr").getAttribute("data-url")).toContain(
      `draft_id=${DRAFT_ID}`,
    );
  });
});
// #endregion

// #region Verified — immutable live QR (plain launcher)
describe("DevelopMiniApp [verified]", () => {
  it("shows only a live QR with no draft_id when there is no draft row", async () => {
    setMetadata({
      draft: null,
      verified: makeRow({
        id: VERIFIED_ID,
        verification_status: "verified",
        integration_url: "https://app.example.com",
      }),
    });
    await renderScene();

    expect(screen.queryByTestId("dev_app_url")).not.toBeInTheDocument();
    const qr = screen.getByTestId("qr");
    expect(qr.getAttribute("data-url")).not.toContain("draft_id");
    expect(qr.getAttribute("data-flag")).toBe("false");
  });

  it("shows both a dev QR (draft_id) and a live QR (no draft_id) during a new version", async () => {
    setMetadata({
      draft: makeRow({ integration_url: "https://staging-v2.example.com" }),
      verified: makeRow({
        id: VERIFIED_ID,
        verification_status: "verified",
        integration_url: "https://app.example.com",
      }),
    });
    await renderScene();

    const devQr = qrByFlag("true");
    const liveQr = qrByFlag("false");
    expect(devQr?.getAttribute("data-url")).toContain(`draft_id=${DRAFT_ID}`);
    expect(liveQr?.getAttribute("data-url")).not.toContain("draft_id");
  });
});
// #endregion

// #region Not a mini app
describe("DevelopMiniApp [external app]", () => {
  it("renders neither the editable field nor any QR", async () => {
    setMetadata({ draft: makeRow({ app_mode: "external" }) });
    await renderScene();

    expect(screen.queryByTestId("dev_app_url")).not.toBeInTheDocument();
    expect(screen.queryByTestId("qr")).not.toBeInTheDocument();
  });
});
// #endregion
