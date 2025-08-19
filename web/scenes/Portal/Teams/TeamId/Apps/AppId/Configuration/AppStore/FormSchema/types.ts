import * as yup from "yup";
import {
  localisationFormSchema,
  mainAppStoreFormReviewSubmitSchema,
  mainAppStoreFormSchema,
} from "./form-schema";

export type LocalisationFormSchema = yup.Asserts<typeof localisationFormSchema>;
export type AppStoreFormValues = yup.Asserts<typeof mainAppStoreFormSchema>;

export type MainAppStoreFormReviewSubmitSchema = yup.Asserts<
  typeof mainAppStoreFormReviewSubmitSchema
>;
