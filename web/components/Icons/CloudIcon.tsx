import { ComponentProps } from "react";

export const CloudIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.3335 8.5C1.3335 11.0773 3.42283 13.1667 6.00016 13.1667H11.3335C13.1744 13.1667 14.6668 11.6743 14.6668 9.83333C14.6668 7.99238 13.1744 6.5 11.3335 6.5C10.97 6.5 10.6201 6.55819 10.2925 6.66576C9.57992 5.00028 7.92632 3.83333 6.00016 3.83333C3.42283 3.83333 1.3335 5.92267 1.3335 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
