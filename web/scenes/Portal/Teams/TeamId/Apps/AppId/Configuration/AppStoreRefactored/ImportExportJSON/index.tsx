import { DecoratedButton } from "@/components/DecoratedButton";
import { formLanguagesList } from "@/lib/languages";
import { useState } from "react";
import { toast } from "react-toastify";
import * as yup from "yup";
import { AppStoreFormValues } from "../form-schema";
import { MAX_FILE_SIZE } from "./constants";
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

type ImportExportJSONLocalisation = yup.InferType<
  typeof importExportJSONLocalisationsSchema
>[number];

type ValidationResult = {
  isValid: boolean;
  error: string | null;
  data: ImportExportJSONLocalisation[] | null;
};

const importExportJSONLocalisationsSchema = yup
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
        name: yup.string().required("Name is required"),
        short_name: yup.string().required("Short name is required"),
        app_tag_line: yup.string().required("App tag line is required"),
        description_overview: yup
          .string()
          .required("Description overview is required"),
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
    name: item.name,
    short_name: item.short_name,
    world_app_description: item.app_tag_line,
    description_overview: item.description_overview,
  }));
};

const validateJSON = (jsonString: string): ValidationResult => {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = importExportJSONLocalisationsSchema.validateSync(parsed);
    return { isValid: true, error: null, data: validated };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { isValid: false, error: "Invalid JSON syntax", data: null };
    }
    if (error instanceof yup.ValidationError) {
      return { isValid: false, error: error.message, data: null };
    }
    return { isValid: false, error: "Unknown validation error", data: null };
  }
};

// custom hooks
const useImportExportDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const openDialog = (initialJson: string) => {
    setJsonInput(initialJson);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setJsonInput("");
  };

  return {
    isOpen,
    jsonInput,
    setJsonInput,
    openDialog,
    closeDialog,
  };
};

const useJSONValidation = () => {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    error: null,
    data: null,
  });

  const validateInput = (jsonString: string) => {
    const result = validateJSON(jsonString);
    setValidationState(result);
    return result;
  };

  return {
    validationState,
    validateInput,
  };
};

const useJSONFileUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    setIsLoading(true);

    if (file.type !== "application/json") {
      toast.error("Invalid file type");
      setIsLoading(false);
      throw new Error("Invalid file type");
    }

    if (file.size >= MAX_FILE_SIZE) {
      toast.error(`File size must be under ${MAX_FILE_SIZE / 1024}kB`);
      setIsLoading(false);
      throw new Error("File too large");
    }

    try {
      toast.info("Uploading file", {
        toastId: "upload_file_toast",
        autoClose: 5000,
      });

      const json = await file.text();
      const validation = validateJSON(json);

      if (validation.isValid) {
        toast.update("upload_file_toast", {
          type: "success",
          render: "File parsed successfully",
          autoClose: 5000,
        });
        return json;
      } else {
        toast.update("upload_file_toast", {
          type: "error",
          render: `Error parsing file: ${validation.error}`,
          autoClose: 5000,
        });
        throw new Error(validation.error || "Validation failed");
      }
    } catch (error) {
      console.error("File parsing Failed: ", error);
      toast.update("upload_file_toast", {
        type: "error",
        render: "Error parsing file",
        autoClose: 5000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    uploadFile,
  };
};

// main orchestrator component
export const ImportExportJSON = (props: ImportExportJSONProps) => {
  const { disabled, localisationsData, onLocalisationsUpdate } = props;

  const dialog = useImportExportDialog();
  const validation = useJSONValidation();
  const fileUpload = useJSONFileUpload();

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

  const handleFileUpload = async (file: File) => {
    try {
      const jsonContent = await fileUpload.uploadFile(file);
      dialog.setJsonInput(jsonContent);
      validation.validateInput(jsonContent);
    } catch (error) {
      // error handling is done in the hook
    }
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
        onFileUpload={handleFileUpload}
        onApplyChanges={handleApplyChanges}
        disabled={disabled}
        isLoading={fileUpload.isLoading}
        hasChanges={hasChanges}
      />

      <DecoratedButton
        variant="primary"
        type="button"
        disabled={disabled}
        onClick={handleDialogOpen}
      >
        Import/Export
      </DecoratedButton>
    </>
  );
};
