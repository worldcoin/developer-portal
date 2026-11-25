/** @jest-environment jsdom */
import { useAppStoreFormContext } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/app-store";
import { localizationFormReviewSubmitSchema } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import { AppStoreFormValues } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/types";
import { LocalizedContentStep } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/LocalizedContentStep";
import { ReviewStep } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/ReviewStep";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";

// #region Mocks
jest.mock("@/lib/utils", () => ({ getCDNImageUrl: jest.fn() }));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation",
  () => ({ basicInfoDraftAtom: jest.requireActual("jotai").atom({}) }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/app-store",
  () => ({ useAppStoreFormContext: jest.fn() }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ShowcaseImagesField",
  () => ({ ShowcaseImagesField: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/MetaTagImageField",
  () => ({ MetaTagImageField: () => null }),
);
// #endregion

// #region Test Data
const useExternalDraftContext = () => {
  const form = useFormContext<AppStoreFormValues>();
  const { fields } = useFieldArray({
    control: form.control,
    name: "localisations",
  });
  return {
    ...form,
    errors: form.formState.errors,
    localisations: fields,
    appMetadata: {
      app_mode: "external",
      verification_status: "unverified",
      world_app_description: "English tagline",
    },
    isEditable: true,
    isEnoughPermissions: true,
    supportedLanguages: ["en", "ja"],
  } as unknown as ReturnType<typeof useAppStoreFormContext>;
};

const ExternalDraft = () => {
  const form = useForm<AppStoreFormValues>({
    defaultValues: {
      localisations: [
        {
          language: "en",
          short_name: "Example",
          world_app_description: "English tagline",
        },
        {
          language: "ja",
          short_name: "例",
          world_app_description: "日本語のタグライン",
        },
      ],
    },
  });
  return (
    <FormProvider {...form}>
      <LocalizedContentStep isMiniApp={false} />
      <ReviewStep teamName="Example" isMiniApp={false} />
    </FormProvider>
  );
};
// #endregion

beforeEach(() => {
  jest
    .mocked(useAppStoreFormContext)
    .mockImplementation(useExternalDraftContext);
});

// #region External integration taglines
describe("external integration taglines", () => {
  it("edits the selected locale while keeping the short name hidden", () => {
    render(<ExternalDraft />);
    const tagline = () => screen.getByRole("textbox", { name: "App tagline" });

    expect(tagline()).toHaveValue("English tagline");
    expect(tagline()).toHaveAttribute("maxlength", "40");
    expect(screen.queryByRole("textbox", { name: "Short name" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(tagline()).toHaveValue("日本語のタグライン");
    fireEvent.change(tagline(), { target: { value: "新しいタグライン" } });

    fireEvent.click(screen.getByRole("button", { name: "English (US)" }));
    expect(tagline()).toHaveValue("English tagline");
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(tagline()).toHaveValue("新しいタグライン");
  });

  it("clears the tagline immediately in the review preview", () => {
    render(<ExternalDraft />);
    expect(screen.getByText("English tagline")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "App tagline" }), {
      target: { value: "" },
    });

    expect(screen.queryByText("English tagline")).toBeNull();
  });

  it("allows a blank tagline when submitting an external localization", async () => {
    await expect(
      localizationFormReviewSubmitSchema.validateAt(
        "world_app_description",
        { world_app_description: "" },
        { context: { isMiniApp: false } },
      ),
    ).resolves.toBe("");
  });
});
// #endregion
