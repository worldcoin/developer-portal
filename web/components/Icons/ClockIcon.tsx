import { ComponentProps } from "react";

export const ClockIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        fill="#4940E0"
        fillRule="evenodd"
        d="M9.545.994a8.552 8.552 0 1 1 0 17.104 8.552 8.552 0 0 1 0-17.104m0 4.575a.795.795 0 0 0-.795.795v3.181c0 .211.083.414.232.563l1.591 1.59a.796.796 0 0 0 1.125-1.125l-1.357-1.357V6.364a.796.796 0 0 0-.796-.795"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};
