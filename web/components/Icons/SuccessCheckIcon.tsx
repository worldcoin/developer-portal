import { ComponentProps } from "react";

export const SuccessCheckIcon = (props: ComponentProps<"svg">) => {
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
        fill="#00C230"
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
        strokeWidth="1.5"
        d="m7.611 12.059 2.223 2.222 5.555-5.556"
      ></path>
    </svg>
  );
};
