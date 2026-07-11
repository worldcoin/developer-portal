import { cropToCanvas, type PixelCrop } from "react-image-crop";

const MAX_BYTES = 500 * 1024;

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to crop image")),
      type,
      quality,
    ),
  );

export const createSquareImage = async (
  file: File,
  image: HTMLImageElement,
  crop: PixelCrop,
) => {
  const cropped = document.createElement("canvas");
  await cropToCanvas(image, cropped, crop);

  const output = document.createElement("canvas");
  const context = output.getContext("2d");
  if (!context) throw new Error("Image cropping is unavailable");

  const sourceSize = crop.width * (image.naturalWidth / image.width);
  const sizes = [512, 400, 320].map((size) => Math.min(size, sourceSize));
  const qualities = file.type === "image/jpeg" ? [0.92, 0.82, 0.72] : [1];

  for (const size of new Set(sizes)) {
    output.width = output.height = Math.max(1, Math.floor(size));
    context.drawImage(cropped, 0, 0, output.width, output.height);

    for (const quality of qualities) {
      const blob = await toBlob(output, file.type, quality);
      if (blob.size < MAX_BYTES) {
        return new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
      }
    }
  }

  throw new Error("The cropped image is still larger than 500 kB");
};
