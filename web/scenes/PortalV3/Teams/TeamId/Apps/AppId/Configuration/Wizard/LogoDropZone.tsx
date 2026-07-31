"use client";

import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useImageFallback } from "@/scenes/PortalV3/common/useImageFallback";
import clsx from "clsx";
import { DragEvent } from "react";

/**
 * Circular app-logo drop target. Shows the current logo when one exists,
 * otherwise the dashed "Drop an image, or Browse" empty state from the design.
 * The error state keeps `bg-system-error-50` so the review flow's
 * scroll-to-first-error (which queries that class) can find it.
 */
export const LogoDropZone = (props: {
  imageUrl?: string;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  error?: string;
}) => {
  const isInert = props.disabled || props.isUploading;
  const logo = useImageFallback(props.imageUrl);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (isInert) return;
    const file = event.dataTransfer.files?.[0];
    if (file) props.onFileSelected(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={clsx(
          "relative flex size-36 flex-col items-center justify-center gap-2 overflow-clip rounded-full border border-dashed px-4 py-3",
          isInert ? "cursor-default" : "cursor-pointer",
          props.disabled && "opacity-60",
          props.error
            ? "border-[#ea392a] bg-system-error-50"
            : // Dashed stroke is Figma nucleus/stroke-transparent (#00000014) —
              // no portal token for it yet.
              "border-black/8 bg-portal-canvas",
        )}
      >
        {/* The file input is named by this label's text, which is empty
            whenever a logo covers it. */}
        <span className="sr-only">Upload app logo</span>
        {props.imageUrl && !logo.isBroken ? (
          <img
            src={props.imageUrl}
            alt=""
            onError={logo.onError}
            className={clsx(
              "absolute inset-0 size-full object-cover",
              props.isUploading && "opacity-50",
            )}
          />
        ) : (
          <>
            <Icon name="share-ios" className="size-6" />
            {/* Body copy is Figma nucleus/foreground-secondary (#7d7d7d) — no
                portal token for it yet (portal-muted is #757575). */}
            <span className="w-full text-center text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
              {props.isUploading ? (
                "Uploading…"
              ) : (
                <>
                  Drop an image,
                  <br />
                  or <span className="text-portal-ink">Browse</span>
                </>
              )}
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={isInert}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onFileSelected(file);
            event.target.value = "";
          }}
        />
      </label>
      {props.error && (
        <p className="max-w-52 text-center text-13 leading-[1.3] font-[350] text-[#ea392a]">
          {props.error}
        </p>
      )}
    </div>
  );
};
