import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const colors = [
  "bg-blue-400",
  "bg-blue-500",
  "bg-blue-600",
  "bg-blue-700",
  "bg-grey-700",
  "bg-grey-900",
  "bg-system-success-400",
  "bg-system-success-500",
  "bg-system-success-600",
  "bg-system-success-700",
  "bg-system-success-800",
  "bg-system-success-900",
  "bg-system-error-500",
  "bg-system-error-600",
  "bg-system-error-700",
  "bg-system-error-800",
  "bg-system-error-900",
  "bg-additional-blue-500",
  "bg-additional-purple-500",
  "bg-additional-green-500",
  "bg-additional-sea-500",
  "bg-additional-orange-500",
  "bg-additional-pink-500",
  "bg-additional-lightOrange-500",
];

export const Placeholder = (props: { name: string; className?: string }) => {
  // Hash function I made up to create entropy
  const hash = props.name.split("").reduce((hash, char) => {
    return (hash << 5) - hash + char.charCodeAt(0);
  }, 0);

  const solidColor = colors[Math.abs(hash) % colors.length];

  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center justify-center rounded-lg",
          solidColor,
          props.className,
        ),
      )}
    >
      <p className="capitalize text-grey-0">{props.name[0]}</p>
    </div>
  );
};
