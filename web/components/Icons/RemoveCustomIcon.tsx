import { ComponentProps } from "react";

export const RemoveCustomIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m12 4-8 8m8 0L4 4"
      ></path>
    </svg>
  );
};
