import * as yup from "yup";
import {
  localizationFormSchema,
  mainAppStoreFormReviewSubmitSchema,
  mainAppStoreFormSchema,
} from "./form-schema";

export type LocalizationFormSchema = yup.Asserts<typeof localizationFormSchema>;
export type AppStoreFormValues = yup.Asserts<typeof mainAppStoreFormSchema>;

export type MainAppStoreFormReviewSubmitSchema = yup.Asserts<
  typeof mainAppStoreFormReviewSubmitSchema
>;
