import { DecoratedButton } from "@/components/DecoratedButton";
import { CodeFolderIcon } from "@/components/Icons/CodeFolderIcon";
import { formLanguagesList } from "@/lib/languages";
import { useState } from "react";
import { toast } from "react-toastify";
import * as yup from "yup";
import { AppStoreFormValues } from "../form-schema";
import { useImportExportDialog, useJSONValidation } from "./hooks";
import { ImportExportDialog } from "./import-export-dialog";

type ImportExportJSONProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  disabled: boolean;
  localisationsData: AppStoreFormValues["localisations"];
  onLocalisationsUpdate: (
    localisations: Omit<
      AppStoreFormValues["localisations"],
      "meta_tag_image_url" | "showcase_img_urls"
    >,
  ) => void;
};

export type ImportExportJSONLocalisation = yup.InferType<
  typeof importExportJSONLocalisationsSchema
>[number];

export const importExportJSONLocalisationsSchema = yup
  .array()
  .of(
    yup
      .object({
        language: yup
          .string()
          .oneOf(
            formLanguagesList.map((lang) => lang.value),
            (value) => `invalid language code - ${value.originalValue}`,
          )
          .required("Language is required"),
        name: yup.string(),
        short_name: yup.string(),
        app_tag_line: yup.string(),
        description_overview: yup.string(),
      })
      .required(),
  )
  .required()
  .strict();

// utility functions
const transformFormLocalisationsToJsonString = (
  localisationsData: AppStoreFormValues["localisations"],
) => {
  try {
    return JSON.stringify(
      localisationsData.map((localisation) => {
        return {
          language: localisation.language,
          name: localisation.name,
          short_name: localisation.short_name,
          app_tag_line: localisation.world_app_description,
          description_overview: localisation.description_overview,
        };
      }),
      null,
      2,
    );
  } catch (error) {
    console.error("Error getting localisations data JSON: ", error);
    return "[]";
  }
};

const transformLocalisationsDataToFormSchema = (
  localisationsData: ImportExportJSONLocalisation[],
): Omit<
  AppStoreFormValues["localisations"],
  "meta_tag_image_url" | "showcase_img_urls"
> => {
  return localisationsData.map((item) => ({
    language: item.language,
    name: item.name ?? "",
    short_name: item.short_name ?? "",
    world_app_description: item.app_tag_line ?? "",
    description_overview: item.description_overview ?? "",
  }));
};

export const ImportExportJSON = (props: ImportExportJSONProps) => {
  const { disabled, localisationsData, onLocalisationsUpdate } = props;

  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  const dialog = useImportExportDialog();
  const validation = useJSONValidation();

  const localisationsDataJSON =
    transformFormLocalisationsToJsonString(localisationsData);

  const handleDialogOpen = () => {
    dialog.openDialog(localisationsDataJSON);
    validation.validateInput(localisationsDataJSON);
  };

  const handleJsonInputChange = (value: string) => {
    dialog.setJsonInput(value);
    validation.validateInput(value);
  };

  const handleApplyChanges = () => {
    if (
      !validation.validationState.isValid ||
      !validation.validationState.data
    ) {
      toast.error("Please fix validation errors before applying changes");
      return;
    }

    try {
      const transformedData = transformLocalisationsDataToFormSchema(
        validation.validationState.data,
      );
      onLocalisationsUpdate(transformedData);
      toast.success("Localisations updated successfully");
      dialog.closeDialog();
    } catch (error) {
      console.error("Error applying changes:", error);
      toast.error("Error applying changes");
    }
  };

  const hasChanges = dialog.jsonInput !== localisationsDataJSON;

  return (
    <>
      <ImportExportDialog
        isOpen={dialog.isOpen}
        onClose={dialog.closeDialog}
        jsonInput={dialog.jsonInput}
        onJsonInputChange={handleJsonInputChange}
        validationError={validation.validationState.error}
        onApplyChanges={handleApplyChanges}
        disabled={disabled}
        hasChanges={hasChanges}
      />
      <div className="relative inline-block">
        <DecoratedButton
          variant="secondary"
          type="button"
          disabled={disabled}
          onClick={handleDialogOpen}
          onPointerEnter={() => setIsTooltipHovered(true)}
          onPointerLeave={() => setIsTooltipHovered(false)}
        >
          <CodeFolderIcon className="size-5" />
        </DecoratedButton>

        {isTooltipHovered && !disabled && (
          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-pre rounded-lg border border-grey-200 bg-white px-3 py-2 text-12 text-grey-900 shadow-lg">
            {`Use a JSON to import/export \nlocalisation data.`}
          </div>
        )}
      </div>
    </>
  );
};
