import { ComponentProps } from "react";

export const EyeIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.5,10 C3.5,7.5 5.5,7.5 10,7.5 C14.5,7.5 16.5,7.5 16.5,10 C16.5,12.5 14.5,12.5 10,12.5 C5.5,12.5 3.5,12.5 3.5,10 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="10"
        cy="10"
        r="1.66667"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};
