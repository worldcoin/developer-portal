import { ComponentProps } from "react";

export const PlusCircleIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_1982_45953)">
        <path
          d="M9.99935 6.66699L9.99935 13.3337M13.3327 10.0003L6.66602 10.0003"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="9.99935"
          cy="10.0003"
          r="8.33333"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_1982_45953">
          <rect width="20" height="20" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
