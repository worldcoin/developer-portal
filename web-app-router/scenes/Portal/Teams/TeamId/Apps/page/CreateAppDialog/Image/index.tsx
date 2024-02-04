import { Fragment, useState } from "react";
import NextImage from "next/image";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

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
          "w-20 h-20 flex justify-center items-center bg-blue-100 rounded-2xl overflow-hidden",
          props.className
        )
      )}
    >
      {src && (
        <NextImage
          src={src}
          alt={props.alt}
          className="object-cover w-full h-full"
          onError={() => setSrc(null)}
        />
      )}

      {!src && <WorldcoinIcon className="h-9 w-9 text-blue-500" />}
    </div>
  );
};
