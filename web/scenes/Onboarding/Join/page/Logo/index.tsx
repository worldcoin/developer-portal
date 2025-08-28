"use client";

import { WorldBlueprintIcon } from "@/components/Icons/WorldBlueprintIcon";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const Logo = (props: {
  className?: string;
  src: string | undefined | null;
}) => {
  const [image, setImage] = useState<string | null | undefined>(props.src);

  return (
    <div
      className={twMerge(
        clsx("size-20 overflow-hidden rounded-2xl", props.className),
      )}
    >
      {image && (
        // FIXME: update src
        <Image
          src={image}
          alt="Team logo"
          onError={() => setImage(null)}
          className="size-full object-contain"
          width={80}
          height={80}
        />
      )}

      {!image && <WorldBlueprintIcon className="size-full" />}
    </div>
  );
};
