import { ComponentProps } from "react";

export const EyeSlashIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g>
        <path
          d="M3.5,10 C3.5,7.5 5.5,7.5 10,7.5 C14.5,7.5 16.5,7.5 16.5,10 C16.5,12.5 14.5,12.5 10,12.5 C5.5,12.5 3.5,12.5 3.5,10 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M8.33333,10 C8.33333,10.9167 9.08333,11.6667 10,11.6667 C10.9167,11.6667 11.6667,10.9167 11.6667,10 C11.6667,9.08333 10.9167,8.33333 10,8.33333"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="3.5"
          y1="16.5"
          x2="16.5"
          y2="3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
