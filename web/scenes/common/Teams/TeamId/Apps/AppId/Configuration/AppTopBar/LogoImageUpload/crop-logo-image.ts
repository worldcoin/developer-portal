export const CROPPED_LOGO_IMAGE_SIZE = 512;

// Sources smaller than the stored logo size would upscale and blur; reject them.
export const MIN_LOGO_IMAGE_SIZE = CROPPED_LOGO_IMAGE_SIZE;

export type ImageDimensions = {
  width: number;
  height: number;
};

export type SquareCropArea = {
  x: number;
  y: number;
  size: number;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error loading image"));
    };

    image.src = url;
  });
};

export const hasImageAspectRatio = (
  { width, height }: ImageDimensions,
  targetWidth: number,
  targetHeight: number,
  tolerance = 0.01,
) => {
  return Math.abs(width / height - targetWidth / targetHeight) <= tolerance;
};

export const createSquareCroppedImageFile = async (
  file: File,
  image: HTMLImageElement,
  cropArea: SquareCropArea,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = CROPPED_LOGO_IMAGE_SIZE;
  canvas.height = CROPPED_LOGO_IMAGE_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to crop image");
  }

  if (file.type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.size,
    cropArea.size,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Unable to crop image"));
          return;
        }

        resolve(result);
      },
      file.type,
      file.type === "image/jpeg" ? 0.92 : undefined,
    );
  });

  return new File([blob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });
};
