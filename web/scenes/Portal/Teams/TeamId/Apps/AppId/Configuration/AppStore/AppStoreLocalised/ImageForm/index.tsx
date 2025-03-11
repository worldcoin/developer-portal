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
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { ImageValidationError, useImage } from "../../../hook/use-image";
import {
  unverifiedImageAtom,
  viewModeAtom,
} from "../../../layout/ImagesProvider";
import {
  FetchLocalisationDocument,
  FetchLocalisationQuery,
} from "../graphql/client/fetch-localisation.generated";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";
import { useUpdateHeroImageMutation } from "./graphql/client/update-hero-image.generated";
import { useUpdateLocalisationHeroImageMutation } from "./graphql/client/update-localisation-hero-image.generated";
import { useUpdateLocalisationShowcaseImagesMutation } from "./graphql/client/update-localisation-showcase-images.generated";
import { useUpdateShowcaseImagesMutation } from "./graphql/client/update-showcase-image.generated";

type ImageFormTypes = {
  appId: string;
  teamId: string;
  locale: string;
  appMetadataId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  localisation?: FetchLocalisationQuery["localisations"][0];
};

const SHOWCASE_IMAGE_NAMES = [
  "showcase_img_1",
  "showcase_img_2",
  "showcase_img_3",
];

type ImageUpdateFunctions = {
  updateHeroImage: (heroImageUrl: string) => Promise<any>;
  updateShowcaseImages: (showcaseImgUrls: string[]) => Promise<any>;
};

export const ImageForm = (props: ImageFormTypes) => {
  const { appId, teamId, appMetadataId, appMetadata, locale, localisation } =
    props;
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [showcaseImageUploading, setShowcaseImageUploading] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [updateHeroImageMutation] = useUpdateHeroImageMutation();
  const [updateShowcaseImagesMutation] = useUpdateShowcaseImagesMutation();
  const [updateLocalisationHeroImageMutation] =
    useUpdateLocalisationHeroImageMutation();
  const [updateLocalisationShowcaseImagesMutation] =
    useUpdateLocalisationShowcaseImagesMutation();
  const { getImage, uploadViaPresignedPost, validateImageAspectRatio } =
    useImage();

  const isEnglishLocale = locale === "en";

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
            ],
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
            ],
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
    locale,
    localisation?.id,
    updateHeroImageMutation,
    updateShowcaseImagesMutation,
    updateLocalisationHeroImageMutation,
    updateLocalisationShowcaseImagesMutation,
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
    }
  }, [setUnverifiedImages, unverifiedImages, updateFunctions]);

  const deleteShowcaseImage = useCallback(
    async (url: string) => {
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
    height: number,
    width: number,
  ) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileTypeEnding = file.type.split("/")[1];

      imageType === "hero_image"
        ? setHeroImageUploading(true)
        : setShowcaseImageUploading(true);
      try {
        await validateImageAspectRatio(file, 1, 1);

        toast.info("Uploading image", {
          toastId: "upload_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        await uploadViaPresignedPost(file, appId, teamId, imageType);

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
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
      }
    }
  };

  const heroImage = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      const imageUrl = isEnglishLocale
        ? appMetadata?.hero_image_url
        : localisation?.hero_image_url;
      if (!imageUrl) return null;
      return getCDNImageUrl(appId, imageUrl);
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
  ]);

  const showcaseImgUrls = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      const urls = isEnglishLocale
        ? appMetadata?.showcase_img_urls
        : localisation?.showcase_img_urls;
      return urls?.map((url: string) => {
        return getCDNImageUrl(appId, url);
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
  ]);

  return (
    <div className="grid gap-y-7">
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Featured image
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          This image will be used for featuring your app on the homepage of
          Worldcoin's app store.
        </Typography>
      </div>
      {!heroImage && (
        <ImageDropZone
          width={1080}
          height={1080}
          disabled={
            unverifiedImages.hero_image_url !== "" ||
            !isEnoughPermissions ||
            !isEditable
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
      {heroImage && (
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
                hidden: !isEnoughPermissions || !isEditable,
              },
            )}
          >
            <TrashIcon />
          </Button>
        </div>
      )}
      {heroImageUploading && (
        <ImageLoader name={"featured_image"} className="h-[132px]" />
      )}

      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Showcase images
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Upload up to 3 images to showcase your application.
        </Typography>
      </div>
      {showcaseImgUrls &&
        showcaseImgUrls?.length < 3 &&
        isEditable &&
        isEnoughPermissions && (
          <ImageDropZone
            width={1080}
            height={1080}
            uploadImage={uploadImage}
            disabled={
              !nextShowcaseImgName || !isEnoughPermissions || !isEditable
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
      <div className="grid gap-y-4 md:grid-cols-3">
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
                    hidden: !isEnoughPermissions || !isEditable,
                  },
                )}
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
    </div>
  );
};
