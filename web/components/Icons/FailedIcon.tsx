import { ComponentProps } from "react";

export const FailedIcon = (props: ComponentProps<"svg">) => {
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
        fill="#F2280D"
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
      <path
        stroke="#fff"
        strokeWidth="1.25"
        d="m8.473 14.3 2.913-2.913m2.912-2.913-2.912 2.913m0 0L8.473 8.474m2.913 2.913 2.912 2.912"
      ></path>
    </svg>
  );
};
