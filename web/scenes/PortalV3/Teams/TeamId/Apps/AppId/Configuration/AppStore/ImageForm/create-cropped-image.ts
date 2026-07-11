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
  const sourceWidth = crop.width * (image.naturalWidth / image.width);
  const sourceHeight = crop.height * (image.naturalHeight / image.height);
  const maxScale = Math.min(
    1,
    target.width / sourceWidth,
    target.height / sourceHeight,
  );
  const maxWidth = sourceWidth * maxScale;
  const qualities = file.type === "image/jpeg" ? [0.92, 0.82, 0.72] : [1];

  for (const scale of [1, 0.8, 0.625, 0.5, 0.4]) {
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
