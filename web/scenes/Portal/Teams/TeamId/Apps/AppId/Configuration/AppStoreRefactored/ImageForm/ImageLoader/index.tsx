import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

const ImageLoader = (props: { name: string; className?: string }) => {
  const { name } = props;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 99) {
          clearInterval(timer);
          return 99;
        }
        const newProgress = oldProgress + 9;
        return Math.min(newProgress, 99);
      });
    }, 150);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      className={twMerge(
        clsx(
          "flex w-44 flex-col items-center justify-center gap-y-2 rounded-lg border border-dashed border-grey-200 px-6",
          props.className,
        ),
      )}
    >
      <div className="w-full">
        <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
          {progress}%
        </Typography>
      </div>
      <div className="w-full rounded-xl bg-gray-200">
        <div
          className="h-2 rounded-xl bg-blue-500 text-center text-xs text-white"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="w-full">
        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          {name}
        </Typography>
      </div>
    </div>
  );
};

export default ImageLoader;
