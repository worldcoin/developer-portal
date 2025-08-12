import { useState } from "react";
import * as yup from "yup";
import {
  ImportExportJSONLocalisation,
  importExportJSONLocalisationsSchema,
} from ".";

type ValidationResult = {
  isValid: boolean;
  error: string | null;
  data: ImportExportJSONLocalisation[] | null;
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

export const useImportExportDialog = () => {
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

export const useJSONValidation = () => {
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
