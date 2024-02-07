import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ImageDropZone } from "@/components/ImageDropZone";
import { unverifiedImageAtom, viewModeAtom } from "../../../layout";
import { useAtom } from "jotai";
import { ImageDisplay } from "./ImageDisplay";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { Button } from "@/components/Button";
import { useUpdateHeroImageMutation } from "./graphql/client/update-hero-image.generated";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useImage } from "../../../hook/use-image";
import { useUpdateShowcaseImagesMutation } from "./graphql/client/update-showcase-image.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";
import clsx from "clsx";
import { UploadIcon } from "@/components/Icons/UploadIcon";

type ImageFormTypes = {
  appId: string;
  teamId: string;
  appMetadataId: string;
  app: FetchAppMetadataQuery["app"][0];
};

const SHOWCASE_IMAGE_NAMES = [
  "showcase_img_1",
  "showcase_img_2",
  "showcase_img_3",
];

export const ImageForm = (props: ImageFormTypes) => {
  const { appId, teamId, appMetadataId, app } = props;
  const [unverifiedImages, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [updateHeroImageMutation] = useUpdateHeroImageMutation();
  const [updateShowcaseImagesMutation] = useUpdateShowcaseImagesMutation();
  const showcaseImgFileNames = app.app_metadata[0].showcase_img_urls;
  const { getImage, uploadViaPresignedPost, validateImageDimensions } =
    useImage();

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const isEditable =
    app?.app_metadata[0]?.verification_status === "unverified" ||
    app?.app_metadata.length === 0;

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
      toast.info("Uploading image", {
        toastId: "upload_toast",
        autoClose: false,
      });

      try {
        await validateImageDimensions(file, width, height);
        await uploadViaPresignedPost(file, appId, teamId, imageType);
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
        }

        toast.update("upload_toast", {
          type: "success",
          render: "Image uploaded successfully",
          autoClose: 5000,
        });
      } catch (error) {
        console.error(error);
        toast.update("upload_toast", {
          type: "error",
          render: "Error uploading image",
          autoClose: 5000,
        });
      }
    }
  };

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
        <UploadIcon className="h-12 w-12 text-blue-500" />
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
            {`JPG or PNG (max 250kb), required size ${1600}x${1200}px`}
          </Typography>
        </div>
      </ImageDropZone>

      {unverifiedImages.hero_image_url && (
        <div className="relative w-fit h-fit">
          <ImageDisplay
            src={unverifiedImages.hero_image_url}
            type={viewMode}
            width={400}
            height={300}
            className="w-40 h-auto rounded-lg"
          />
          <Button
            type="button"
            onClick={deleteHeroImage}
            className={clsx(
              "bg-grey-100 hover:bg-grey-200 h-8 w-8 flex items-center justify-center rounded-full absolute -top-3 -right-3",
              { hidden: !isEnoughPermissions || !isEditable },
            )}
          >
            <TrashIcon />
          </Button>
        </div>
      )}

      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Showcase images
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Upload up to 3 images to showcase your application in work. It will be
          displayed at the top of your app’s detail page in the App Store
        </Typography>
      </div>
      <ImageDropZone
        width={1920}
        height={1080}
        uploadImage={uploadImage}
        disabled={!nextShowcaseImgName || !isEnoughPermissions || !isEditable}
        imageType={nextShowcaseImgName}
      >
        <UploadIcon className="h-12 w-12 text-blue-500" />
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
            {`JPG or PNG (max 250kb), required size ${1920}x${1080}px`}
          </Typography>
        </div>
      </ImageDropZone>
      <div className="grid grid-cols-3">
        {unverifiedImages.showcase_image_urls &&
          unverifiedImages.showcase_image_urls.map((url, index) => (
            <div className="relative w-fit h-fit" key={index}>
              <ImageDisplay
                src={url}
                type={viewMode}
                width={640}
                height={360}
                className="w-40 h-auto rounded-lg"
              />
              <Button
                type="button"
                onClick={() => deleteShowcaseImage(url)}
                className={clsx(
                  "bg-grey-100 hover:bg-grey-200 h-8 w-8 flex items-center justify-center rounded-full absolute -top-3 -right-3",
                  { hidden: !isEnoughPermissions || !isEditable },
                )}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
      </div>
    </form>
  );
};
