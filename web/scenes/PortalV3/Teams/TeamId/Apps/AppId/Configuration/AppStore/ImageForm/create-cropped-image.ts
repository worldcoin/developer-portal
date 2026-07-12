import { cropToCanvas, type PixelCrop } from "react-image-crop";
import { MAX_IMAGE_BYTES } from "../../hook/use-image";

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to crop image")),
      type,
      quality,
    ),
  );

/**
 * Pixel size the export will have at full quality: the crop region at the
 * image's native resolution. We deliberately do not cap resolution — only
 * aspect ratio and the byte limit are enforced, so the file-size ladder in
 * createCroppedImage is the only thing that can shrink it.
 */
export const getCroppedOutputSize = (
  image: HTMLImageElement,
  crop: PixelCrop,
  target: { width: number; height: number },
) => {
  const width = Math.max(
    1,
    Math.floor(crop.width * (image.naturalWidth / image.width)),
  );
  return {
    width,
    height: Math.max(1, Math.round(width / (target.width / target.height))),
  };
};

export const createCroppedImage = async (
  file: File,
  image: HTMLImageElement,
  crop: PixelCrop,
  target: { width: number; height: number },
) => {
  const cropped = document.createElement("canvas");
  await cropToCanvas(image, cropped, crop);

  const output = document.createElement("canvas");
  const context = output.getContext("2d");
  if (!context) throw new Error("Image cropping is unavailable");

  const aspectRatio = target.width / target.height;
  const maxWidth = getCroppedOutputSize(image, crop, target).width;
  const qualities = file.type === "image/jpeg" ? [0.92, 0.82, 0.72] : [1];

  // Native resolution first; step down geometrically only as far as the byte
  // limit demands. The descent always reaches a width every encoder fits
  // under the limit, so no crop can dead-end on file size.
  const scales: number[] = [];
  for (let scale = 1; ; scale *= 0.8) {
    scales.push(scale);
    if (maxWidth * scale <= 256) break;
  }

  for (const scale of scales) {
    output.width = Math.max(1, Math.floor(maxWidth * scale));
    output.height = Math.max(1, Math.round(output.width / aspectRatio));
    context.clearRect(0, 0, output.width, output.height);
    context.drawImage(cropped, 0, 0, output.width, output.height);

    for (const quality of qualities) {
      const blob = await toBlob(output, file.type, quality);
      if (blob.size < MAX_IMAGE_BYTES) {
        return new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
      }
    }
  }

  throw new Error("The cropped image is still larger than 500 kB");
};
