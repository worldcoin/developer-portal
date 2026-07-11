"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import {
  createCroppedImage,
  getCroppedOutputSize,
} from "./create-cropped-image";

type ImageCropperProps = {
  file: File;
  targetWidth: number;
  targetHeight: number;
  isApplying: boolean;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
  previewAlt?: string;
};

/** Adds our upload/export behavior around react-image-crop's interaction UI. */
export const ImageCropper = ({
  file,
  targetWidth,
  targetHeight,
  isApplying,
  onCancel,
  onApply,
  previewAlt = "Image crop preview",
}: ImageCropperProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  }>();
  const [error, setError] = useState<string>();
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const safePreviewUrl = useMemo(() => {
    if (!previewUrl.startsWith("blob:")) {
      throw new Error("Invalid image preview URL");
    }
    return encodeURI(previewUrl);
  }, [previewUrl]);

  useEffect(
    () => () => {
      URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  // Best-case export size for the current selection; the byte-limit ladder
  // can only shrink it further.
  const outputSize = useMemo(() => {
    const image = imageRef.current;
    if (!image || !completedCrop) return undefined;
    return getCroppedOutputSize(image, completedCrop, {
      width: targetWidth,
      height: targetHeight,
    });
  }, [completedCrop, targetWidth, targetHeight]);

  const initializeCrop = (image: HTMLImageElement) => {
    const width = image.width;
    const height = image.height;
    if (!width || !height) return;

    setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });

    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 78 },
        targetWidth / targetHeight,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, width, height));
  };

  const applyCrop = async () => {
    if (!imageRef.current || !completedCrop) return;
    setError(undefined);

    try {
      await onApply(
        await createCroppedImage(file, imageRef.current, completedCrop, {
          width: targetWidth,
          height: targetHeight,
        }),
      );
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Unable to crop this image",
      );
    }
  };

  return (
    <div className="grid justify-items-center gap-6">
      <Typography variant={TYPOGRAPHY.R4} className="text-center text-grey-500">
        Drag the crop area to move it. Pull any corner to resize it.
      </Typography>

      {naturalSize && outputSize ? (
        <Typography
          variant={TYPOGRAPHY.R5}
          className="text-center text-grey-400"
        >
          Final Resolution: {outputSize.width}×{outputSize.height}
        </Typography>
      ) : null}

      {/* overflow-hidden + padding: the crop handles overhang the image edge
          by a few px, which under overflow-auto spawned scrollbars mid-drag. */}
      <div className="flex max-h-[420px] w-full max-w-[520px] justify-center overflow-hidden rounded-2xl bg-grey-100 p-2">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={setCompletedCrop}
          aspect={targetWidth / targetHeight}
          minWidth={48}
          keepSelection
          ruleOfThirds
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={safePreviewUrl}
            alt={previewAlt}
            onLoad={(event) => initializeCrop(event.currentTarget)}
            className="block max-h-[404px] max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      {error ? (
        <Typography
          role="alert"
          variant={TYPOGRAPHY.R4}
          className="text-center text-system-error-500"
        >
          {error}
        </Typography>
      ) : null}

      <div className="grid w-full grid-cols-2 gap-4">
        <DecoratedButton
          type="button"
          variant="secondary"
          disabled={isApplying}
          onClick={onCancel}
        >
          Cancel
        </DecoratedButton>
        <DecoratedButton
          type="button"
          loading={isApplying}
          disabled={isApplying || !completedCrop}
          onClick={() => void applyCrop()}
        >
          Crop & upload
        </DecoratedButton>
      </div>
    </div>
  );
};
