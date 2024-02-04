import { ComponentProps } from "react";

export const TestTubeIcon = (props: ComponentProps<"svg">) => {
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
        d="M13.3337 1.66699V15.0003C13.3337 16.8413 11.8413 18.3337 10.0003 18.3337C8.15938 18.3337 6.66699 16.8413 6.66699 15.0003V1.66699"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.66699 7.13005C7.40773 6.16893 8.59248 6.86177 10.0003 7.76498C11.8522 8.95305 12.9633 8.04153 13.3337 7.17917"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.83398 1.66699H14.1673"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16699 15.002L9.17422 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.834 11.6685L10.8412 11.6665"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
