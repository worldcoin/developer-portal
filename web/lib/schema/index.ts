// a place for common schema definitions that should remain uniform across the app
import * as yup from "yup";

export const appNameSchema = yup
  .string()
  .required("App name is required")
  .max(40, "App name cannot exceed 40 characters")
  .matches(/^[a-zA-Z0-9\s]+$/, {
    message: "App name can only contain letters, numbers, and spaces",
    excludeEmptyString: true,
  });
