import * as yup from "yup";

export const createActionSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string().nullable(),
  action: yup.string().required("Action is required"),
  app_id: yup.string().required("App ID is required"),
  max_verifications: yup.number().required("Max verifications is required"),
});

export type CreateActionSchema = yup.Asserts<typeof createActionSchema>;
