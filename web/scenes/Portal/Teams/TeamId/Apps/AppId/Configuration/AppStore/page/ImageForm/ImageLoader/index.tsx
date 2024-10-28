import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

const ImageLoader = (props: { name: string; className?: string }) => {
  const { name } = props;
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 99) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 99;
        }
        return Math.min(oldProgress + 9, 99);
      });
    }, 150);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
