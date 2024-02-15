import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";

export const ImageDisplay = (props: {
  src: string;
  type: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  const { src, type, className, width, height } = props;
  const [imgSrc, setImgSrc] = useState<string>(src);
  const handleError = () => {
    toast.error("Image failed to load");
    setImgSrc("");
  };
  // Verified images are cached by cloudfront and Next/Image actually causes slower load times.
  if (type === "verified") {
    return (
      // Note: We use img since cloudfront auto caches the image and we want to avoid a second cache from Next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt="verified"
        className={className}
        onError={handleError}
      />
    );
  }
  return (
    <Image
      src={imgSrc}
      alt="image"
      onError={handleError}
      className={className}
      width={width}
      height={height}
    />
  );
};
