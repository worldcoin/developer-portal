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
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";

// #region Mocks
const flushAllMock = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/SaveStatus",
  () => ({
    SaveStatusIndicator: () => null,
    useSaveStatusActions: () => ({ flushAll: flushAllMock }),
  }),
);

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { hasura: { memberships: [] } } }),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review",
  () => ({
    useRemoveFromReview: () => ({
      removeFromReview: jest.fn(),
      loading: false,
    }),
  }),
);

const createNewDraftMock = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-create-new-draft",
  () => ({
    useCreateNewDraft: () => ({
      createNewDraft: createNewDraftMock,
      isCreating: false,
    }),
  }),
);

let mockAppStoreAutosaveSuccess:
  | ((values: Record<string, unknown>) => void)
  | undefined;
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/app-store",
  () => ({
    AppStoreForm: ({
      children,
      onAutosaveSuccess,
    }: {
      children: React.ReactNode;
      onAutosaveSuccess?: (values: Record<string, unknown>) => void;
    }) => {
      mockAppStoreAutosaveSuccess = onAutosaveSuccess;
      return children;
    },
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStoreActions",
  () => ({ AppStoreActions: () => null }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/BasicInformationStep",
  () => ({
    BasicInformationStep: () => null,
    WizardLogoUpload: () => null,
    useResolvedLogoUrl: () => null,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/AvailabilityStep",
  () => ({ AvailabilityStep: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/LocalisedContentStep",
  () => ({ LocalisedContentStep: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/ReviewStep",
  () => ({ ReviewStep: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/StoreListingStep",
  () => ({ StoreListingStep: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm",
  () => ({ SetupForm: () => null }),
);
// #endregion

import { getDefaultStore } from "jotai";
import { ConfigurationWizard } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard";
import { WizardStep } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/Stepper";
import {
  isMiniAppAtom,
  viewModeAtom,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";

// #region Test Data
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a" as const;
const teamId = "team_0b1509aa95ebcd6d96fd71221166cfc3" as const;

const draftMetadata = {
  id: "meta_draft",
  app_id: appId,
  app_mode: "external",
  verification_status: "unverified",
  logo_img_url: "",
};
const verifiedMetadata = {
  ...draftMetadata,
  id: "meta_verified",
  verification_status: "verified",
};
const app = {
  app_metadata: [draftMetadata],
  verified_app_metadata: [verifiedMetadata],
};

type TestAppStoreFormValues = {
  category: string;
  support_type: string;
  support_email: string;
  support_link: string;
  is_android_only: boolean;
  is_for_humans_only: boolean;
  supported_countries: string[];
  supported_languages: string[];
  localisations: Array<{
    language: string;
    name: string;
    short_name: string;
    world_app_description: string;
    description_overview: string;
    meta_tag_image_url: string;
    showcase_img_urls: string[];
  }>;
};

const defaultAppStoreFormValues: TestAppStoreFormValues = {
  category: "External",
  support_type: "email",
  support_email: "",
  support_link: "",
  is_android_only: false,
  is_for_humans_only: false,
  supported_countries: [],
  supported_languages: ["en"],
  localisations: [
    {
      language: "en",
      name: "",
      short_name: "",
      world_app_description: "",
      description_overview: "",
      meta_tag_image_url: "",
      showcase_img_urls: [],
    },
  ],
};

let mockAppStoreForm: UseFormReturn<TestAppStoreFormValues> | null = null;

const WizardTestFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const form = useForm<TestAppStoreFormValues>({
    defaultValues: defaultAppStoreFormValues,
  });
  mockAppStoreForm = form;
  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderWizard = (onVersionSwitchingChange = jest.fn()) =>
  render(
    <WizardTestFormProvider>
      <ConfigurationWizard
        appId={appId}
        teamId={teamId}
        app={app as never}
        appMetadata={draftMetadata as never}
        teamName="Test team"
        activeStep={WizardStep.BASIC}
        setActiveStep={jest.fn()}
        onVersionSwitchingChange={onVersionSwitchingChange}
      />
    </WizardTestFormProvider>,
  );
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getDefaultStore().set(viewModeAtom, "unverified");
  getDefaultStore().set(isMiniAppAtom, false);
  mockAppStoreAutosaveSuccess = undefined;
  mockAppStoreForm = null;
});

describe("configuration wizard [step completion]", () => {
  it("waits for autosave success before showing a completion check", () => {
    renderWizard();

    expect(
      screen.getByRole("button", { name: "Availability, incomplete" }),
    ).toBeInTheDocument();

    act(() => {
      mockAppStoreForm!.setValue("supported_countries", ["US"]);
    });

    expect(
      screen.getByRole("button", { name: "Availability, incomplete" }),
    ).toBeInTheDocument();

    act(() => {
      mockAppStoreAutosaveSuccess?.(mockAppStoreForm!.getValues());
    });

    expect(
      screen.getByRole("button", { name: "Availability, complete" }),
    ).toBeInTheDocument();
  });
});

describe("configuration wizard [version switching]", () => {
  it("waits for pending autosaves before switching to the verified version", async () => {
    let finishFlush!: (result: boolean) => void;
    const onVersionSwitchingChange = jest.fn();
    flushAllMock.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishFlush = resolve;
      }),
    );
    renderWizard(onVersionSwitchingChange);

    fireEvent.click(screen.getByRole("button", { name: "Go to Verified" }));

    expect(flushAllMock).toHaveBeenCalledTimes(1);
    expect(onVersionSwitchingChange).toHaveBeenCalledWith(true);
    expect(getDefaultStore().get(viewModeAtom)).toBe("unverified");
    expect(screen.getByTestId("configuration-wizard")).toHaveAttribute("inert");
    expect(screen.getByTestId("configuration-wizard")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByTestId("configuration-version-indicator"),
    ).toHaveAccessibleName("Draft version");

    await act(async () => finishFlush(true));

    await waitFor(() =>
      expect(getDefaultStore().get(viewModeAtom)).toBe("verified"),
    );
    expect(onVersionSwitchingChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId("configuration-wizard")).not.toHaveAttribute(
      "inert",
    );
  });

  it("does not switch versions when a pending autosave cannot be flushed", async () => {
    const onVersionSwitchingChange = jest.fn();
    flushAllMock.mockResolvedValue(false);
    renderWizard(onVersionSwitchingChange);

    fireEvent.click(screen.getByRole("button", { name: "Go to Verified" }));

    await waitFor(() => expect(flushAllMock).toHaveBeenCalledTimes(1));
    expect(getDefaultStore().get(viewModeAtom)).toBe("unverified");
    expect(
      screen.getByTestId("configuration-version-indicator"),
    ).toHaveAccessibleName("Draft version");
    expect(onVersionSwitchingChange).toHaveBeenNthCalledWith(1, true);
    expect(onVersionSwitchingChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId("configuration-wizard")).not.toHaveAttribute(
      "inert",
    );
  });
});
