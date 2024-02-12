import { ComponentProps } from "react";

export const MagnifierIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_2811_4392)">
        <path
          d="M14.583 14.584L18.333 18.334"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.666 9.16699C16.666 5.02486 13.3082 1.66699 9.16601 1.66699C5.02388 1.66699 1.66602 5.02486 1.66602 9.16699C1.66602 13.3091 5.02388 16.667 9.16601 16.667C13.3082 16.667 16.666 13.3091 16.666 9.16699Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2811_4392">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
