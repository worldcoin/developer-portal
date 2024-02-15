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
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";
import { useUpdateHeroImageMutation } from "./graphql/client/update-hero-image.generated";
import { useUpdateShowcaseImagesMutation } from "./graphql/client/update-showcase-image.generated";

type ImageFormTypes = {
  appId: string;
  teamId: string;
  appMetadataId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

const SHOWCASE_IMAGE_NAMES = [
  "showcase_img_1",
  "showcase_img_2",
  "showcase_img_3",
];

export const ImageForm = (props: ImageFormTypes) => {
  const { appId, teamId, appMetadataId, appMetadata } = props;
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [showcaseImageUploading, setShowcaseImageUploading] = useState(false);
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [updateHeroImageMutation] = useUpdateHeroImageMutation();
  const [updateShowcaseImagesMutation] = useUpdateShowcaseImagesMutation();
  const {
    resizeFile,
    getImage,
    uploadViaPresignedPost,
    validateImageAspectRatio,
  } = useImage();

  const showcaseImgFileNames = useMemo(
    () => appMetadata?.showcase_img_urls ?? [],
    [appMetadata?.showcase_img_urls],
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

      const result = await updateHeroImageMutation({
        variables: {
          app_metadata_id: appMetadataId,
          hero_image_url: "",
        },
        context: { headers: { team_id: teamId } },
        refetchQueries: [
          {
            query: FetchAppMetadataDocument,
            variables: {
              id: appId,
            },
            context: { headers: { team_id: teamId } },
          },
        ],
      });
      if (result instanceof Error) {
        throw result;
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting image");
    }
  }, [
    setUnverifiedImages,
    unverifiedImages,
    updateHeroImageMutation,
    appMetadataId,
    teamId,
    appId,
  ]);

  const deleteShowcaseImage = useCallback(
    async (url: string) => {
      const fileNameToDelete = SHOWCASE_IMAGE_NAMES.filter((name: string) =>
        url.includes(name),
      )[0];

      const formatted_showcase_img_urls = `{${showcaseImgFileNames
        .filter((img: string) => !img.includes(fileNameToDelete))
        .map((fileName: string) => `"${fileName}"`)
        .join(",")}}`;

      const result = await updateShowcaseImagesMutation({
        variables: {
          app_metadata_id: appMetadataId,
          showcase_img_urls: formatted_showcase_img_urls,
        },
        context: { headers: { team_id: teamId } },
        refetchQueries: [
          {
            query: FetchAppMetadataDocument,
            variables: {
              id: appId,
            },
            context: { headers: { team_id: teamId } },
          },
        ],
        awaitRefetchQueries: true,
      });

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
      updateShowcaseImagesMutation,
      appMetadataId,
      teamId,
      appId,
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
        // Aspect Ratio
        let aspectRatioWidth, aspectRatioHeight;
        if (width === 1920 && height === 1080) {
          aspectRatioWidth = 16;
          aspectRatioHeight = 9;
        } else if (width === 1600 && height === 1200) {
          aspectRatioWidth = 4;
          aspectRatioHeight = 3;
        } else {
          throw new Error("Invalid aspect ratio");
        }
        await validateImageAspectRatio(
          file,
          aspectRatioWidth,
          aspectRatioHeight,
        );

        const resizedImage = await resizeFile(file, width, height, file.type);

        toast.info("Uploading image", {
          toastId: "upload_toast",
          autoClose: false,
        });
        toast.dismiss("ImageValidationError");

        await uploadViaPresignedPost(resizedImage, appId, teamId, imageType);
        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          imageType,
        );

        const saveFileType = fileTypeEnding === "jpeg" ? "jpg" : fileTypeEnding;
        if (imageType === "hero_image") {
          const result = await updateHeroImageMutation({
            variables: {
              app_metadata_id: appMetadataId,
              hero_image_url: `${imageType}.${saveFileType}`,
            },
            context: { headers: { team_id: teamId } },
            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: {
                  id: appId,
                },
                context: { headers: { team_id: teamId } },
              },
            ],
          });
          if (result instanceof Error) {
            throw result;
          }
          setUnverifiedImages({
            ...unverifiedImages,
            [`${imageType}_url`]: imageUrl,
          });
          setHeroImageUploading(false);
        } else if (imageType.startsWith("showcase_img")) {
          const formatted_showcase_img_urls = `{${[
            ...showcaseImgFileNames,
            `${imageType}.${saveFileType}`,
          ]
            .map((url: string) => `"${url}"`)
            .join(",")}}`;

          const result = await updateShowcaseImagesMutation({
            variables: {
              app_metadata_id: appMetadataId,
              showcase_img_urls: formatted_showcase_img_urls,
            },
            context: { headers: { team_id: teamId } },
            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: {
                  id: appId,
                },
                context: { headers: { team_id: teamId } },
              },
            ],
            awaitRefetchQueries: true,
          });

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
        console.error(error);

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
      if (!appMetadata?.hero_image_url) return null;
      return getCDNImageUrl(appId, appMetadata?.hero_image_url);
    } else {
      return unverifiedImages.hero_image_url;
    }
  }, [
    appMetadata?.hero_image_url,
    appId,
    unverifiedImages.hero_image_url,
    appMetadata?.verification_status,
  ]);

  const showcaseImgUrls = useMemo(() => {
    if (appMetadata?.verification_status === "verified") {
      return appMetadata?.showcase_img_urls?.map((url: string) => {
        return getCDNImageUrl(appId, url);
      });
    } else {
      return unverifiedImages.showcase_image_urls;
    }
  }, [
    appMetadata?.verification_status,
    appMetadata?.showcase_img_urls,
    appId,
    unverifiedImages.showcase_image_urls,
  ]);

  return (
    <form className="grid gap-y-7">
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Featured image
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          This image will be used for featuring your app on the homepage of
          Worldcoin’s App Store, or other display areas of Worldcoin
        </Typography>
      </div>
      {!heroImage && (
        <ImageDropZone
          width={1600}
          height={1200}
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
              {`JPG or PNG (max 250kb), required aspect ratio 4:3. \nRecommended size: ${1600}x${1200}px`}
            </Typography>
          </div>
        </ImageDropZone>
      )}
      {heroImage && (
        <div className="relative size-fit">
          <ImageDisplay
            src={heroImage}
            type={viewMode}
            width={400}
            height={300}
            className="h-auto w-44 rounded-lg"
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
      {heroImageUploading && <ImageLoader name={"featured_image"} />}

      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Showcase images
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Upload up to 3 images to showcase your application in work. It will be
          displayed at the top of your app’s detail page in the App Store
        </Typography>
      </div>
      {showcaseImgUrls?.length < 3 && (
        <ImageDropZone
          width={1920}
          height={1080}
          uploadImage={uploadImage}
          disabled={!nextShowcaseImgName || !isEnoughPermissions || !isEditable}
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
              {`JPG or PNG (max 250kb), required aspect ratio 16:9. Recommended size: ${1920}x${1080}px`}
            </Typography>
          </div>
        </ImageDropZone>
      )}
      <div className="grid gap-y-4 md:grid-cols-3">
        {showcaseImgUrls &&
          showcaseImgUrls.map((url: string, index: number) => (
            <div className="relative size-fit" key={index}>
              <ImageDisplay
                src={url}
                type={viewMode}
                width={640}
                height={360}
                className="h-auto w-44 rounded-lg"
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
          <ImageLoader name={`showcase_image_${showcaseImgUrls.length}`} />
        )}
      </div>
    </form>
  );
};
