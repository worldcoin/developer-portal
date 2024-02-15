"use client";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
  }, [type, src]);

  const handleError = () => {
    toast.error("Image failed to load");
    setImgSrc("");
  };

  const handleLoad = (e: any) => {
    setIsLoading(false);
  };

  // Verified images are cached by cloudfront and Next/Image actually causes slower load times.
  if (type === "verified") {
    // Note: We use img since cloudfront auto caches the image and we want to avoid a second cache from Next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className={(clsx("relative"), className)}>
        <img
          src={imgSrc}
          alt="verified"
          className={clsx({ "absolute opacity-0": isLoading }, className)}
          onError={handleError}
          onLoad={handleLoad}
        />
        <Skeleton
          className={clsx("absolute", { hidden: !isLoading }, className)}
        />
      </div>
    );
  }
  return (
    <div className={(clsx("relative"), className)}>
      <Image
        src={imgSrc}
        alt="image"
        onError={handleError}
        className={clsx({ "absolute opacity-0": isLoading }, className)}
        width={width}
        height={height}
        onLoad={handleLoad}
      />
      <Skeleton
        className={clsx("absolute", { hidden: !isLoading }, className)}
      />
    </div>
  );
};
