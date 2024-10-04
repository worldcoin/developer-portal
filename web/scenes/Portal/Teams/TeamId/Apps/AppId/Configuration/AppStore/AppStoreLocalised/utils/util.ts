import * as yup from "yup";
import { DescriptionSubFields } from "../../../types";

export const parseDescription = (stringifiedDescription: string) => {
  if (stringifiedDescription) {
    try {
      return JSON.parse(stringifiedDescription);
    } catch (error) {
      console.error("Failed to parse description:", error);
      return {
        description_overview: stringifiedDescription,
        description_how_it_works: "",
        description_connect: "",
      };
    }
  }
  return {
    description_overview: "",
    description_how_it_works: "",
    description_connect: "",
  };
};

export const encodeDescription = (
  description_overview: string,
  description_how_it_works: string = "",
  description_connect: string = "",
) => {
  return JSON.stringify({
    [DescriptionSubFields.DescriptionOverview]: description_overview,
    [DescriptionSubFields.DescriptionHowItWorks]: description_how_it_works,
    [DescriptionSubFields.DescriptionConnect]: description_connect,
  });
};

function noLinks(value: string | undefined) {
  if (!value) return true;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return !urlRegex.test(value);
}

export const formatEmailLink = (email: string | undefined) => {
  if (!email) return;
  if (email.startsWith("mailto:")) {
    return email;
  }
  return `mailto:${email}`;
};

export const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  short_name: yup.string().required("Short name is required").max(10),
  category: yup.string().optional(),
  world_app_description: yup
    .string()
    .max(35, "Annotation cannot exceed 35 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .required(),
  world_app_button_text: yup
    .string()
    .max(25, "Content cannot exceed 25 characters")
    .optional(),
  app_website_url: yup
    .string()
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
  support_link: yup.string().url("Invalid URL"),
  support_email: yup.string().email("Invalid email address"),
  supported_countries: yup
    .array(
      yup
        .string()
        .required("This field is required")
        .length(2, "Invalid country code"),
    )
    .min(1, "This field is required")
    .required("This field is required")
    .default([]),
  supported_languages: yup
    .array(yup.string().required("This field is required"))
    .min(1, "This field is required")
    .required("This field is required")
    .default(["en"])
    .test("has-english", "English is a required language", (langs) =>
      langs.includes("en"),
    ),
});
