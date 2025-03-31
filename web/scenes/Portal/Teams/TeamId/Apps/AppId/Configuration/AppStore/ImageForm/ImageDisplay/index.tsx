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
}) => {
  const { src, type, className, width, height } = props;
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoading(true);
  }, [type, src]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoading(false);
    }
  }, [src]);

  const handleError = () => {
    toast.error("Image failed to load");
    setImgSrc("");
  };

  const handleLoad = (e: any) => {
    setIsLoading(false);
  };

  if (type === "verified") {
    // Note: We use img since cloudfront auto caches the image and we want to avoid a second cache from Next/image.
    return (
      <div className={(clsx("relative"), className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          ref={imgRef}
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
