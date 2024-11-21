import * as yup from "yup";

export const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(40, "App name cannot exceed 40 characters")
    .matches(/^[a-zA-Z0-9\s]+$/, {
      message: "App name can only contain letters, numbers, and spaces",
      excludeEmptyString: true,
    }),
  integration_url: yup
    .string()
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
});
export type BasicInformationFormValues = yup.Asserts<typeof schema>;
