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
  return {};
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
