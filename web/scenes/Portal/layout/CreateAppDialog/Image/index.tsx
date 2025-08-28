import { WorldIcon } from "@/components/Icons/WorldIcon";
import clsx from "clsx";
import NextImage from "next/image";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const Image = (props: {
  src: string | undefined | null;
  alt: string;
  className?: string;
}) => {
  const [src, setSrc] = useState<string | undefined | null>(props.src);

  return (
    <div
      className={twMerge(
        clsx(
          "flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-blue-100",
          props.className,
        ),
      )}
    >
      {src && (
        <NextImage
          src={src}
          alt={props.alt}
          className="size-full object-cover"
          onError={() => setSrc(null)}
        />
      )}

      {!src && <WorldIcon className="size-9 text-blue-500" />}
    </div>
  );
};
