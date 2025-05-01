import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, getCDNImageUrl } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import {
  FetchImagesDocument,
  useFetchImagesQuery,
} from "../../../graphql/client/fetch-images.generated";
import { ImageValidationError, useImage } from "../../../hook/use-image";
import {
  unverifiedImageAtom,
  viewModeAtom,
} from "../../../layout/ImagesProvider";
import {
  FetchLocalisationDocument,
  FetchLocalisationQuery,
} from "../graphql/client/fetch-localisation.generated";
import { useUpdateHeroImageMutation } from "./graphql/client/update-hero-image.generated";
import { useUpdateLocalisationHeroImageMutation } from "./graphql/client/update-localisation-hero-image.generated";
import { useUpdateLocalisationMetaTagImageMutation } from "./graphql/client/update-localisation-meta-tag-image.generated";
import { useUpdateLocalisationShowcaseImagesMutation } from "./graphql/client/update-localisation-showcase-images.generated";
import { useUpdateMetaTagImageMutation } from "./graphql/client/update-meta-tag-image.generated";
import { useUpdateShowcaseImagesMutation } from "./graphql/client/update-showcase-image.generated";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

type ImageFormTypes = {
  appId: string;
  teamId: string;
  locale: string;
  appMetadataId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  localisation?: FetchLocalisationQuery["localisations"][0];
  onOperationStateChange?: (isInProgress: boolean) => void;
};

const SHOWCASE_IMAGE_NAMES = [
  "showcase_img_1",
  "showcase_img_2",
  "showcase_img_3",
];

type ImageUpdateFunctions = {
  updateHeroImage: (heroImageUrl: string) => Promise<any>;
  updateMetaTagImage: (metaTagImageUrl: string) => Promise<any>;
  updateShowcaseImages: (showcaseImgUrls: string[]) => Promise<any>;
};

export const ImageForm = (props: ImageFormTypes) => {
  const {
    appId,
    teamId,
    appMetadataId,
    appMetadata,
    locale,
    localisation,
    onOperationStateChange,
  } = props;
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [metaTagImageUploading, setMetaTagImageUploading] = useState(false);
  const [showcaseImageUploading, setShowcaseImageUploading] = useState(false);
  const [isAnyOperationInProgress, setIsAnyOperationInProgress] =
    useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [updateHeroImageMutation] = useUpdateHeroImageMutation();
  const [updateMetaTagImageMutation] = useUpdateMetaTagImageMutation();
  const [updateShowcaseImagesMutation] = useUpdateShowcaseImagesMutation();
  const [updateLocalisationHeroImageMutation] =
    useUpdateLocalisationHeroImageMutation();
  const [updateLocalisationMetaTagImageMutation] =
    useUpdateLocalisationMetaTagImageMutation();
  const [updateLocalisationShowcaseImagesMutation] =
    useUpdateLocalisationShowcaseImagesMutation();
  const { getImage, uploadViaPresignedPost, validateImageAspectRatio } =
    useImage();

  const isEnglishLocale = locale === "en";

  const { data: imagesData, loading: isLoadingImages } = useFetchImagesQuery({
    variables: {
      id: appId,
      team_id: teamId,
      locale: locale,
    },
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    if (imagesData?.unverified_images) {
      setUnverifiedImages({
        logo_img_url: imagesData.unverified_images.logo_img_url ?? "",
        hero_image_url: imagesData.unverified_images.hero_image_url ?? "",
        meta_tag_image_url:
          imagesData.unverified_images.meta_tag_image_url ?? "",
        showcase_image_urls: imagesData.unverified_images.showcase_img_urls,
      });
    } else {
      setUnverifiedImages({
        logo_img_url: "",
        hero_image_url: "",
        showcase_image_urls: [],
        meta_tag_image_url: "",
      });
    }
  }, [locale, imagesData, setUnverifiedImages]);

  const updateFunctions: ImageUpdateFunctions = useMemo(() => {
    if (isEnglishLocale) {
      return {
        updateHeroImage: async (heroImageUrl: string) => {
          return updateHeroImageMutation({
            variables: {
              app_metadata_id: appMetadataId,
              hero_image_url: heroImageUrl,
            },
            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: { id: appId },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
        updateMetaTagImage: async (metaTagImageUrl: string) => {
          return updateMetaTagImageMutation({
            variables: {
              app_metadata_id: appMetadataId,
              meta_tag_image_url: metaTagImageUrl,
            },
            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: { id: appId },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
        updateShowcaseImages: async (showcaseImgUrls: string[]) => {
          const formatted_showcase_img_urls = `{${showcaseImgUrls.map((url) => `"${url}"`).join(",")}}`;
          return updateShowcaseImagesMutation({
            variables: {
              app_metadata_id: appMetadataId,
              showcase_img_urls: formatted_showcase_img_urls,
            },
            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: { id: appId },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
      };
    } else {
      return {
        updateHeroImage: async (heroImageUrl: string) => {
          return updateLocalisationHeroImageMutation({
            variables: {
              localisation_id: localisation?.id ?? "",
              hero_image_url: heroImageUrl,
            },
            refetchQueries: [
              {
                query: FetchLocalisationDocument,
                variables: {
                  id: appMetadataId,
                  locale: locale,
                },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
        updateMetaTagImage: async (metaTagImageUrl: string) => {
          return updateLocalisationMetaTagImageMutation({
            variables: {
              localisation_id: localisation?.id ?? "",
              meta_tag_image_url: metaTagImageUrl,
            },
            refetchQueries: [
              {
                query: FetchLocalisationDocument,
                variables: {
                  id: appMetadataId,
                  locale: locale,
                },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
        updateShowcaseImages: async (showcaseImgUrls: string[]) => {
          return updateLocalisationShowcaseImagesMutation({
            variables: {
              localisation_id: localisation?.id ?? "",
              showcase_img_urls: showcaseImgUrls,
            },
            refetchQueries: [
              {
                query: FetchLocalisationDocument,
                variables: {
                  id: appMetadataId,
                  locale: locale,
                },
              },
              {
                query: FetchImagesDocument,
                variables: { id: appId, team_id: teamId, locale },
              },
            ],
            awaitRefetchQueries: true,
          });
        },
      };
    }
  }, [
    isEnglishLocale,
    appMetadataId,
    appId,
    teamId,
    locale,
    localisation?.id,
    updateHeroImageMutation,
    updateShowcaseImagesMutation,
    updateLocalisationHeroImageMutation,
    updateLocalisationShowcaseImagesMutation,
    updateMetaTagImageMutation,
    updateLocalisationMetaTagImageMutation,
  ]);

  const showcaseImgFileNames = useMemo(
    () =>
      isEnglishLocale
        ? appMetadata?.showcase_img_urls ?? []
        : localisation?.showcase_img_urls ?? [],
    [
      isEnglishLocale,
      appMetadata?.showcase_img_urls,
      localisation?.showcase_img_urls,
    ],
  );

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isEditable = appMetadata?.verification_status === "unverified";

  const nextShowcaseImgName = useMemo(() => {
    if (!showcaseImgFileNames) return SHOWCASE_IMAGE_NAMES[0];
    return SHOWCASE_IMAGE_NAMES.find(
      (name: string) =>
        !showcaseImgFileNames.find((existingFileName: string) =>
          existingFileName.includes(name),
        ),
    );
  }, [showcaseImgFileNames]);

  const deleteHeroImage = useCallback(async () => {
    try {
      setIsAnyOperationInProgress(true);
      setUnverifiedImages({
        ...unverifiedImages,
        hero_image_url: "",
      });

      const result = await updateFunctions.updateHeroImage("");
      if (result instanceof Error) {
        throw result;
      }
    } catch (error) {
      console.error("Error Deleting Image: ", error);
      toast.error("Error deleting image");
    } finally {
      setIsAnyOperationInProgress(false);
    }
  }, [setUnverifiedImages, unverifiedImages, updateFunctions]);

  const deleteMetaTagImage = useCallback(async () => {
    try {
      setIsAnyOperationInProgress(true);
      setUnverifiedImages({
        ...unverifiedImages,
        meta_tag_image_url: "",
      });

      const result = await updateFunctions.updateMetaTagImage("");
      if (result instanceof Error) {
        throw result;
      }
    } catch (error) {
      console.error("Error Deleting Image: ", error);
      toast.error("Error deleting image");
    } finally {
      setIsAnyOperationInProgress(false);
    }
  }, [setUnverifiedImages, unverifiedImages, updateFunctions]);

  const deleteShowcaseImage = useCallback(
    async (url: string) => {
      try {
        setIsAnyOperationInProgress(true);
        const fileNameToDelete = SHOWCASE_IMAGE_NAMES.filter((name: string) =>
          url.includes(name),
        )[0];

        const newShowcaseImgUrls = showcaseImgFileNames.filter(
          (img: string) => !img.includes(fileNameToDelete),
        );

        const result =
          await updateFunctions.updateShowcaseImages(newShowcaseImgUrls);

        if (result instanceof Error) {
          throw result;
        }

        setUnverifiedImages({
          ...unverifiedImages,
          showcase_image_urls: unverifiedImages.showcase_image_urls?.filter(
            (img: string) => img !== url,
          ),
        });
      } catch (error) {
        console.error("Error deleting showcase image: ", error);
        toast.error("Error deleting image");
      } finally {
        setIsAnyOperationInProgress(false);
      }
    },
    [
      showcaseImgFileNames,
      updateFunctions,
      setUnverifiedImages,
      unverifiedImages,
    ],
  );

  const uploadImage = async (
    imageType: string,
    file: File,
    requiredHeight = 1,
    requiredWidth = 1,
  ) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileTypeEnding = file.type.split("/")[1];

      setIsAnyOperationInProgress(true);
      if (imageType === "hero_image") {
        setHeroImageUploading(true);
      } else if (imageType === "meta_tag_image") {
        setMetaTagImageUploading(true);
      } else {
        setShowcaseImageUploading(true);
      }

      try {
        await validateImageAspectRatio(file, requiredWidth, requiredHeight);

        toast.info("Uploading image", {
          toastId: "upload_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        await uploadViaPresignedPost(
          file,
          appId,
          teamId,
          imageType,
          !isEnglishLocale ? locale : undefined,
        );

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
          !isEnglishLocale ? locale : undefined,
        );

        const saveFileType = fileTypeEnding === "jpeg" ? "jpg" : fileTypeEnding;
        const fileName = `${imageType}.${saveFileType}`;

        if (imageType === "hero_image") {
          const result = await updateFunctions.updateHeroImage(fileName);
          if (result instanceof Error) {
            throw result;
          }
          setUnverifiedImages({
            ...unverifiedImages,
            [`${imageType}_url`]: imageUrl,
          });
          setHeroImageUploading(false);
        } else if (imageType === "meta_tag_image") {
          const result = await updateFunctions.updateMetaTagImage(fileName);
          if (result instanceof Error) {
            throw result;
          }
          setUnverifiedImages({
            ...unverifiedImages,
            [`${imageType}_url`]: imageUrl,
          });
          setMetaTagImageUploading(false);
        } else if (imageType.startsWith("showcase_img")) {
          const newShowcaseImgUrls = [...showcaseImgFileNames, fileName];
          const result =
            await updateFunctions.updateShowcaseImages(newShowcaseImgUrls);

          if (result instanceof Error) {
            throw result;
          }

          setUnverifiedImages({
            ...unverifiedImages,
            showcase_image_urls: [
              ...(unverifiedImages.showcase_image_urls ?? []),
              imageUrl,
            ],
          });
          setShowcaseImageUploading(false);
        }

        toast.update("upload_toast", {
          type: "success",
          render: "Image uploaded and saved",
          autoClose: 5000,
        });
      } catch (error) {
        console.error("Error Uploading Image: ", error);

        if (error instanceof ImageValidationError) {
          toast.dismiss("upload_toast");
        } else {
          toast.update("upload_toast", {
            type: "error",
            render: "Error uploading image",
            autoClose: 5000,
          });
        }

        setHeroImageUploading(false);
        setShowcaseImageUploading(false);
      } finally {
        setIsAnyOperationInProgress(false);
      }
    }
  };

  const heroImage = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      const imageUrl = isEnglishLocale
        ? appMetadata?.hero_image_url
        : localisation?.hero_image_url;
      if (!imageUrl) return null;
      return getCDNImageUrl(
        appId,
        imageUrl,
        true,
        !isEnglishLocale ? locale : undefined,
      );
    } else {
      return unverifiedImages.hero_image_url;
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.hero_image_url,
    localisation?.hero_image_url,
    isEnglishLocale,
    appId,
    unverifiedImages.hero_image_url,
    locale,
  ]);

  const metaTagImage = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      const imageUrl = isEnglishLocale
        ? appMetadata?.meta_tag_image_url
        : localisation?.meta_tag_image_url;
      if (!imageUrl) return null;
      return getCDNImageUrl(
        appId,
        imageUrl,
        true,
        !isEnglishLocale ? locale : undefined,
      );
    } else {
      return unverifiedImages.meta_tag_image_url;
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.meta_tag_image_url,
    localisation?.meta_tag_image_url,
    isEnglishLocale,
    appId,
    unverifiedImages.meta_tag_image_url,
    locale,
  ]);

  const showcaseImgUrls = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      const urls = isEnglishLocale
        ? appMetadata?.showcase_img_urls
        : localisation?.showcase_img_urls;
      return urls?.map((url: string) => {
        return getCDNImageUrl(
          appId,
          url,
          true,
          !isEnglishLocale ? locale : undefined,
        );
      });
    } else {
      return unverifiedImages.showcase_image_urls;
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.showcase_img_urls,
    localisation?.showcase_img_urls,
    isEnglishLocale,
    appId,
    unverifiedImages.showcase_image_urls,
    locale,
  ]);

  useEffect(() => {
    onOperationStateChange?.(isAnyOperationInProgress);
  }, [isAnyOperationInProgress, onOperationStateChange]);

  return (
    <div className="grid gap-y-7">
      {/* Featured image */}
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Featured image (required)
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          This image will be used for featuring your app on the homepage of
          World Mini Apps.
        </Typography>
      </div>
      {isLoadingImages && (
        <div className="size-fit">
          <Skeleton className="size-32 rounded-lg" />
        </div>
      )}
      {!isLoadingImages && !heroImage && !heroImageUploading && (
        <ImageDropZone
          width={1080}
          height={1080}
          disabled={
            unverifiedImages.hero_image_url !== "" ||
            !isEnoughPermissions ||
            !isEditable ||
            isAnyOperationInProgress
          }
          uploadImage={uploadImage}
          imageType={"hero_image"}
        >
          <UploadIcon className="size-12 text-blue-500" />
          <div className="gap-y-2">
            <div className="text-center">
              <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                Click to upload
              </Typography>{" "}
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                {" "}
                or drag and drop
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              {`JPG or PNG (max 500kB), required aspect ratio 1:1. \nRecommended size: ${1080}x${1080}px`}
            </Typography>
          </div>
        </ImageDropZone>
      )}
      {!isLoadingImages && heroImage && (
        <div className="relative size-fit">
          <ImageDisplay
            src={heroImage}
            type={viewMode}
            width={300}
            height={300}
            className="h-auto w-32 rounded-lg"
          />
          <Button
            type="button"
            onClick={deleteHeroImage}
            className={clsx(
              "absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200",
              {
                hidden:
                  !isEnoughPermissions ||
                  !isEditable ||
                  isAnyOperationInProgress,
                "cursor-not-allowed opacity-50": isAnyOperationInProgress,
              },
            )}
            disabled={isAnyOperationInProgress}
          >
            <TrashIcon />
          </Button>
        </div>
      )}
      {heroImageUploading && (
        <ImageLoader name={"featured_image"} className="h-[132px]" />
      )}

      {/* Meta tag image */}
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Meta tag image (optional)
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          This image is optional and will be displayed as the OpenGraph meta
          tags image when linking your app. Fallback to your app&apos;s logo
          image if not provided.
        </Typography>
      </div>
      {isLoadingImages && (
        <div className="size-fit">
          <Skeleton className="size-32 rounded-lg" />
        </div>
      )}
      {!isLoadingImages && !metaTagImage && !metaTagImageUploading && (
        <ImageDropZone
          width={1200}
          height={600}
          disabled={
            unverifiedImages.meta_tag_image_url !== "" ||
            !isEnoughPermissions ||
            !isEditable ||
            isAnyOperationInProgress
          }
          uploadImage={uploadImage}
          imageType={"meta_tag_image"}
        >
          <UploadIcon className="size-12 text-blue-500" />
          <div className="gap-y-2">
            <div className="text-center">
              <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                Click to upload
              </Typography>{" "}
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                {" "}
                or drag and drop
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              {`JPG or PNG (max 500kB), required aspect ratio 2:1. \nRecommended size: ${1200}x${600}px`}
            </Typography>
          </div>
        </ImageDropZone>
      )}
      {!isLoadingImages && metaTagImage && (
        <div className="relative size-fit">
          <ImageDisplay
            src={metaTagImage}
            type={viewMode}
            width={300}
            height={300}
            className="h-auto w-32 rounded-lg"
          />
          <Button
            type="button"
            onClick={deleteMetaTagImage}
            className={clsx(
              "absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200",
              {
                hidden:
                  !isEnoughPermissions ||
                  !isEditable ||
                  isAnyOperationInProgress,
                "cursor-not-allowed opacity-50": isAnyOperationInProgress,
              },
            )}
            disabled={isAnyOperationInProgress}
          >
            <TrashIcon />
          </Button>
        </div>
      )}
      {metaTagImageUploading && (
        <ImageLoader name={"meta_tag_image"} className="h-[132px]" />
      )}

      {/* Showcase images */}
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Showcase images (required)
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Upload up to 3 images to showcase your application.
        </Typography>
      </div>
      {isLoadingImages && (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="size-32 rounded-lg" />
          ))}
        </div>
      )}
      {!isLoadingImages &&
        (!showcaseImgUrls || showcaseImgUrls?.length < 3) &&
        isEditable &&
        isEnoughPermissions && (
          <ImageDropZone
            width={1080}
            height={1080}
            uploadImage={uploadImage}
            disabled={
              !nextShowcaseImgName ||
              !isEnoughPermissions ||
              !isEditable ||
              showcaseImageUploading ||
              isAnyOperationInProgress
            }
            imageType={nextShowcaseImgName}
          >
            <UploadIcon className="size-12 text-blue-500" />
            <div className="gap-y-2">
              <div className="text-center">
                <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                  Click to upload
                </Typography>{" "}
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                  {" "}
                  or drag and drop
                </Typography>
              </div>
              <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                {`JPG or PNG (max 500kB), required aspect ratio 1:1. Recommended size: ${1080}x${1080}px`}
              </Typography>
            </div>
          </ImageDropZone>
        )}
      {!isLoadingImages && (
        <div className="grid gap-4 md:grid-cols-3">
          {showcaseImgUrls &&
            showcaseImgUrls.map((url: string, index: number) => (
              <div className="relative size-fit" key={url}>
                <ImageDisplay
                  src={url}
                  type={viewMode}
                  width={300}
                  height={300}
                  className="h-auto w-32 rounded-lg"
                />
                <Button
                  type="button"
                  onClick={() => deleteShowcaseImage(url)}
                  className={clsx(
                    "absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200",
                    {
                      hidden:
                        !isEnoughPermissions ||
                        !isEditable ||
                        isAnyOperationInProgress,
                      "cursor-not-allowed opacity-50": isAnyOperationInProgress,
                    },
                  )}
                  disabled={isAnyOperationInProgress}
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
          {showcaseImageUploading && (
            <ImageLoader
              name={`showcase_image_${showcaseImgUrls?.length}`}
              className="h-[99px]"
            />
          )}
        </div>
      )}
    </div>
  );
};
