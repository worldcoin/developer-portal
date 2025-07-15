import * as yup from "yup";
import { localisationFormSchema, mainAppStoreFormSchema } from "./form-schema";

export type LocalisationFormSchema = yup.Asserts<typeof localisationFormSchema>;
export type AppStoreFormValues = yup.Asserts<typeof mainAppStoreFormSchema>;
