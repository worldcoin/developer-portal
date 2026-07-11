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
import { createSquareImage } from "./create-square-image";

type SquareImageCropperProps = {
  file: File;
  isApplying: boolean;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
};

/** Adds our upload/export behavior around react-image-crop's interaction UI. */
export const SquareImageCropper = ({
  file,
  isApplying,
  onCancel,
  onApply,
}: SquareImageCropperProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
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

  const initializeCrop = (image: HTMLImageElement) => {
    const width = image.width;
    const height = image.height;
    if (!width || !height) return;

    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 78 }, 1, width, height),
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
        await createSquareImage(file, imageRef.current, completedCrop),
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
        Drag the square to move it. Pull any corner to resize it.
      </Typography>

      <div className="flex max-h-[420px] w-full max-w-[520px] justify-center overflow-auto rounded-2xl bg-grey-100">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={setCompletedCrop}
          aspect={1}
          minWidth={48}
          keepSelection
          ruleOfThirds
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={safePreviewUrl}
            alt="Logo crop preview"
            onLoad={(event) => initializeCrop(event.currentTarget)}
            className="block max-h-[420px] max-w-full object-contain"
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
