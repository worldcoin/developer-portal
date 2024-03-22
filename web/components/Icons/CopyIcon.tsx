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
      <g clipPath="url(#clip0_2239_15710)">
        <path
          d="M6.66699 6.66663V4.99996C6.66699 3.15901 8.15938 1.66663 10.0003 1.66663L15.0003 1.66663C16.8413 1.66663 18.3337 3.15901 18.3337 4.99996V9.99996C18.3337 11.8409 16.8413 13.3333 15.0003 13.3333H13.3337M6.66699 6.66663H5.00033C3.15938 6.66663 1.66699 8.15901 1.66699 9.99996V15C1.66699 16.8409 3.15938 18.3333 5.00033 18.3333H10.0003C11.8413 18.3333 13.3337 16.8409 13.3337 15V13.3333M6.66699 6.66663H10.0003C11.8413 6.66663 13.3337 8.15901 13.3337 9.99996V13.3333"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2239_15710">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
