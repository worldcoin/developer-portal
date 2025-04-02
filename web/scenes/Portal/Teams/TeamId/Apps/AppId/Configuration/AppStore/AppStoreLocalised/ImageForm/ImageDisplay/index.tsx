"use client";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

export const ImageDisplay = (props: {
  src: string;
  type: string;
  className?: string;
  width?: number;
  height?: number;
  onLoadComplete?: () => void;
}) => {
  const { src, type, className, width, height, onLoadComplete } = props;
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setImgSrc(src);
  }, [type, src]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoading(false);
      onLoadComplete?.();
    }
  }, [src, onLoadComplete]);

  const handleError = () => {
    toast.error("Image failed to load");
    setImgSrc("");
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  if (type === "verified") {
    // Note: We use img since cloudfront auto caches the image and we want to avoid a second cache from Next/image.
    return (
      <div className={clsx("relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          ref={imgRef}
          alt="verified"
          className={clsx(
            "transition-opacity duration-300",
            { "opacity-0": isLoading },
            className,
          )}
          onError={handleError}
          onLoad={handleLoad}
        />
        <Skeleton
          className={clsx(
            "absolute inset-0",
            { hidden: !isLoading },
            className,
          )}
        />
      </div>
    );
  }
  return (
    <div className={clsx("relative", className)}>
      <Image
        src={imgSrc}
        alt="image"
        onError={handleError}
        className={clsx(
          "transition-opacity duration-300",
          { "opacity-0": isLoading },
          className,
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
      />
      <Skeleton
        className={clsx("absolute inset-0", { hidden: !isLoading }, className)}
      />
    </div>
  );
};
