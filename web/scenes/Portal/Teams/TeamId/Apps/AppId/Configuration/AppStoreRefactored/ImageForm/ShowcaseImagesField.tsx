import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { ImageDropZone } from "@/components/ImageDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getCDNImageUrl } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { ImageValidationError, useImage } from "../../hook/use-image";
import { ImageDisplay } from "./ImageDisplay";
import ImageLoader from "./ImageLoader";

interface ShowcaseImagesFieldProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  appId: string;
  teamId: string;
  locale?: string; // for non-english localizations
  isAppVerified: boolean;
}

export const ShowcaseImagesField = (props: ShowcaseImagesFieldProps) => {
  const {
    value = [],
    onChange,
    disabled = false,
    appId,
    teamId,
    locale,
    isAppVerified,
  } = props;
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);

  const { validateImageAspectRatio, uploadViaPresignedPost, getImage } =
    useImage();

  const { data: imagesData, loading: isImagesLoading } = useFetchImagesQuery({
    variables: { id: appId, team_id: teamId, locale },
  });

  // cleanup on unmount
  const handleUnmount = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  const uploadImage = useCallback(
    async (_imageType: string, file: File, height: number, width: number) => {
      if (!file || !(file.type === "image/png" || file.type === "image/jpeg")) {
        return;
      }

      if (value.length >= 3) {
        toast.error("maximum of 3 showcase images allowed");
        return;
      }

      const fileTypeEnding = file.type.split("/")[1];

      try {
        // validate first, before showing any progress
        await validateImageAspectRatio(file, width, height);

        // only start showing progress after validation passes
        setIsUploading(true);

        toast.info("uploading showcase image", {
          toastId: "upload_showcase_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        // use showcase_img_N format for image type
        const showcaseImageType = `showcase_img_${value.length + 1}`;

        await uploadViaPresignedPost(
          file,
          appId,
          teamId,
          showcaseImageType,
          locale,
        );

        const imageUrl = await getImage(
          fileTypeEnding,
          appId,
          teamId,
          showcaseImageType,
          locale,
        );

        // check if component is still mounted/valid before updating
        if (!isMountedRef.current) {
          toast.dismiss("upload_showcase_toast");
          toast.warning("Upload completed but localization was removed", {
            autoClose: 3000,
          });
          return;
        }

        onChange([...value, imageUrl]);

        toast.update("upload_showcase_toast", {
          type: "success",
          render: "Showcase image uploaded successfully",
          autoClose: 1000,
        });
      } catch (error) {
        console.error("error uploading showcase image:", error);

        if (error instanceof ImageValidationError) {
          toast.dismiss("upload_showcase_toast");
        } else {
          toast.update("upload_showcase_toast", {
            type: "error",
            render: "Error uploading showcase image",
            autoClose: 1000,
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [
      validateImageAspectRatio,
      uploadViaPresignedPost,
      getImage,
      appId,
      teamId,
      locale,
      value,
      onChange,
    ],
  );

  const handleDelete = useCallback(
    (indexToDelete: number) => {
      const newUrls = value.filter((_, index) => index !== indexToDelete);
      onChange(newUrls);
    },
    [value, onChange],
  );

  // set cleanup function
  useEffect(() => {
    return handleUnmount;
  }, [handleUnmount]);

  const canUploadMore = value.length < 3;

  const showcaseImgUrls = useMemo(() => {
    if (isAppVerified) {
      const urls =
        locale === "en"
          ? value
          : imagesData?.unverified_images?.showcase_img_urls;
      return urls?.map((url: string) => {
        return getCDNImageUrl(appId, url, true, locale);
      });
    } else {
      return imagesData?.unverified_images?.showcase_img_urls;
    }
  }, [
    isAppVerified,
    locale,
    value,
    imagesData?.unverified_images?.showcase_img_urls,
    appId,
  ]);

  return (
    <div className="grid gap-y-3">
      <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
        Showcase Images <span className="text-system-error-500">*</span>
      </Typography>
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        upload up to 3 images to showcase your application.
      </Typography>

      {/* existing images */}
      {value.length > 0 && !isImagesLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="relative size-fit">
              <ImageDisplay
                src={showcaseImgUrls?.[index] || ""}
                type="original"
                width={150}
                height={150}
                className="h-auto w-32 rounded-lg"
              />
              <Button
                type="button"
                onClick={() => handleDelete(index)}
                disabled={disabled}
                className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon />
              </Button>
            </div>
          ))}

          {/* upload loader */}
          {isUploading && (
            <ImageLoader
              name={`showcase_image_${value.length + 1}`}
              className="h-[128px] w-32"
            />
          )}
        </div>
      )}

      {/* show skeleton when loading and have images */}
      {value.length > 0 && isImagesLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {value.map((url, index) => (
            <Skeleton
              key={`${url}-${index}`}
              height={128}
              className="w-32 rounded-lg"
            />
          ))}
        </div>
      )}

      {/* upload zone */}
      {canUploadMore && !isUploading && !isImagesLoading && (
        <ImageDropZone
          width={1080}
          height={1080}
          disabled={disabled || isUploading || !canUploadMore}
          uploadImage={uploadImage}
          imageType={`showcase_img_${value.length + 1}`}
        >
          <UploadIcon className="size-12 text-blue-500" />
          <div className="gap-y-2">
            <div className="text-center">
              <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
                click to upload
              </Typography>{" "}
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                or drag and drop
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              jpg or png (max 500kb), required aspect ratio 1:1.{"\n"}
              recommended size: 1080x1080px
            </Typography>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
              {value.length}/3 images uploaded
            </Typography>
          </div>
        </ImageDropZone>
      )}

      {/* show skeleton when loading and no images yet */}
      {value.length === 0 && !isUploading && isImagesLoading && (
        <Skeleton height={200} className="rounded-lg" />
      )}

      {/* show loader when no images yet */}
      {value.length === 0 && isUploading && (
        <ImageLoader name="showcase_image_1" className="h-[200px]" />
      )}
    </div>
  );
};
