import { ComponentProps } from "react";

export const InformationCircleIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_2847_2881)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.833984 8.00065C0.833984 11.9587 4.04261 15.1673 8.00065 15.1673C11.9587 15.1673 15.1673 11.9587 15.1673 8.00065C15.1673 4.04261 11.9587 0.833984 8.00065 0.833984C4.04261 0.833984 0.833984 4.04261 0.833984 8.00065ZM7.78869 7.35204C7.95339 7.37418 8.18121 7.43345 8.37454 7.62678C8.56787 7.82011 8.62714 8.04793 8.64929 8.21263C8.66763 8.34907 8.66753 8.50771 8.66745 8.64096L8.66744 8.66722V11.3339C8.66744 11.7021 8.36896 12.0006 8.00077 12.0006C7.63258 12.0006 7.3341 11.7021 7.3341 11.3339V8.66722C6.96591 8.66722 6.66744 8.36874 6.66744 8.00055C6.66744 7.63236 6.96591 7.33389 7.3341 7.33389L7.36036 7.33388C7.49361 7.33379 7.65225 7.33369 7.78869 7.35204ZM7.99761 4.66732C7.63107 4.66732 7.33393 4.96579 7.33393 5.33398C7.33393 5.70217 7.63107 6.00065 7.99761 6.00065H8.00357C8.37012 6.00065 8.66726 5.70217 8.66726 5.33398C8.66726 4.96579 8.37012 4.66732 8.00357 4.66732H7.99761Z"
          fill="url(#paint0_linear_2847_2881)"
        />
      </g>

      <defs>
        <linearGradient
          id="paint0_linear_2847_2881"
          x1="8.00065"
          y1="0.833984"
          x2="8.00065"
          y2="15.1673"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>

        <clipPath id="clip0_2847_2881">
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
