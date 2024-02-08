"use client";

import clsx from "clsx";
import { CSSProperties, useState } from "react";
import { twMerge } from "tailwind-merge";
import NextImage from "next/image";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useAtom } from "jotai";
import { colorAtom } from "@/scenes/Portal/layout";

export const Image = (props: {
  className?: string;
  src: string | undefined | null;
  teamName: string;
  alt: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);
  const [color] = useAtom(colorAtom);

  return (
    <div
      style={
        {
          "--color-500": color?.[500],
          "--color-100": color?.[100],
        } as CSSProperties
      }
      className={twMerge(
        clsx(
          "h-full w-full rounded-2xl overflow-hidden flex justify-center items-center bg-[var(--color-100)] text-[var(--color-500)]",
          props.className
        )
      )}
    >
      {src && (
        <NextImage
          src={src}
          alt={props.alt}
          width={80}
          height={80}
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <Typography variant={TYPOGRAPHY.H7} className="uppercase">
          {props.teamName?.[0]}
        </Typography>
      )}
    </div>
  );
};
