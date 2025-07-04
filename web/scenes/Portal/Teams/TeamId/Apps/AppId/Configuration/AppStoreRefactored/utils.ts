import { DescriptionSubFields } from "../types";

export const parseDescription = (
  stringifiedDescription: string,
): {
  description_overview: string;
  description_how_it_works: string;
  description_connect: string;
} => {
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
/**
 * use server-side only
 */
export const encodeDescription = (
  description_overview: string,
  description_how_it_works: string = "",
  description_connect: string = "",
) =>
  JSON.stringify({
    [DescriptionSubFields.DescriptionOverview]: description_overview,
    [DescriptionSubFields.DescriptionHowItWorks]: description_how_it_works,
    [DescriptionSubFields.DescriptionConnect]: description_connect,
  });

export const formatEmailLink = (email: string | undefined) => {
  if (!email) return;
  if (email.startsWith("mailto:")) {
    return email;
  }
  return `mailto:${email}`;
};

export const SHOWCASE_IMAGE_NAMES = [
  "showcase_img_1",
  "showcase_img_2",
  "showcase_img_3",
] as const;
export const META_TAG_IMAGE_NAME = "meta_tag_image" as const;
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "png"] as const;

type ImagePath =
  | `${(typeof SHOWCASE_IMAGE_NAMES)[number]}.${(typeof ALLOWED_IMAGE_EXTENSIONS)[number]}`
  | `${typeof META_TAG_IMAGE_NAME}.${(typeof ALLOWED_IMAGE_EXTENSIONS)[number]}`
  | "";

/**
 * @param url - actual url of the image, usually world-id-assets.com
 * @returns image path. we store this value in the db and construct the actual url from it
 */
export const extractImagePathWithExtensionFromActualUrl = (
  url: string | undefined | null,
): ImagePath => {
  if (!url) {
    return "" as const;
  }
  const extension = ALLOWED_IMAGE_EXTENSIONS.find((ext) => url.includes(ext));

  if (!extension) {
    return "" as const;
  }

  const showcaseImageName = SHOWCASE_IMAGE_NAMES.find((name) =>
    url.includes(name),
  );

  if (showcaseImageName) {
    return `${showcaseImageName}.${extension}` as const;
  }

  if (url.includes(META_TAG_IMAGE_NAME)) {
    return `${META_TAG_IMAGE_NAME}.${extension}` as const;
  }
  return "" as const;
};
