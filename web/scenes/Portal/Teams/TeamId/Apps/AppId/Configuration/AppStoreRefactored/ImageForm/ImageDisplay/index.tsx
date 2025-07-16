"use client";
import clsx from "clsx";
import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    toast.error("Image failed to load");
    setIsLoading(false);
    setHasError(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoadComplete?.();
  };

  if (!src && !isLoading) {
    return null;
  }

  if (type === "verified") {
    return (
      <div className={clsx("relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="verified"
          className={clsx(
            "transition-opacity duration-300",
            { "opacity-0": isLoading || hasError },
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="image"
        onError={handleError}
        className={clsx(
          "transition-opacity duration-300",
          { "opacity-0": isLoading || hasError },
          className,
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
      />
      <Skeleton
        className={clsx("absolute inset-0", { hidden: !isLoading }, className)}
      />
    </div>
  );
};
