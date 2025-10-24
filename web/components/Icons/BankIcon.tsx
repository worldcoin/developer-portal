import { ComponentProps } from "react";

export const BankIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        stroke="#181818"
        strokeWidth="1.765"
        d="M21 7H3v-.5L12 2l9 4.5zM2 20.118h20M5.884 10v7M11.882 10v7M17.884 10v7"
      ></path>
    </svg>
  );
};
