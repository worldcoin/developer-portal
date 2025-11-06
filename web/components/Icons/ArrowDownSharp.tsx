import { ComponentProps } from "react";

export const ArrowDownSharpIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      fill="none"
      viewBox="0 0 12 12"
      {...props}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
        d="m4.5 9 2.646-2.646c.167-.167.25-.25.25-.354s-.083-.187-.25-.354L4.5 3"
      ></path>
    </svg>
  );
};
