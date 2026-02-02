import { ComponentProps } from "react";

export const CopyIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_6155_2805)">
        <path
          d="M6.66602 6.66663V4.99996C6.66602 3.15901 8.1584 1.66663 9.99935 1.66663L14.9993 1.66663C16.8403 1.66663 18.3327 3.15901 18.3327 4.99996V9.99996C18.3327 11.8409 16.8403 13.3333 14.9993 13.3333H13.3327M6.66602 6.66663H4.99935C3.1584 6.66663 1.66602 8.15901 1.66602 9.99996V15C1.66602 16.8409 3.1584 18.3333 4.99935 18.3333H9.99935C11.8403 18.3333 13.3327 16.8409 13.3327 15V13.3333M6.66602 6.66663H9.99935C11.8403 6.66663 13.3327 8.15901 13.3327 9.99996V13.3333"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6155_2805">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
