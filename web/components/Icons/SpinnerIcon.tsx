import { ComponentProps } from "react";

export const SpinnerIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="23"
      height="23"
      fill="none"
      viewBox="0 0 23 23"
      {...props}
    >
      <rect
        width="21.5"
        height="21.5"
        x="0.75"
        y="0.75"
        fill="#fff"
        rx="10.75"
      ></rect>
      <rect
        width="21.5"
        height="21.5"
        x="0.75"
        y="0.75"
        stroke="#fff"
        strokeWidth="1.5"
        rx="10.75"
      ></rect>
      <circle
        cx="11.5"
        cy="11.5"
        r="9"
        stroke="#191C20"
        strokeOpacity="0.16"
        strokeWidth="2"
      ></circle>
      <path
        fill="#181818"
        d="M16.41 2.788a10 10 0 0 0-9.634-.102l.936 1.747a8.02 8.02 0 0 1 7.725.082z"
      ></path>
    </svg>
  );
};
