import { ComponentProps } from "react";

export const NotificationBellIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="16" fill="#005CFF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.8991 9.70312C17.8887 9.70312 20.0859 11.2476 20.0859 13.7624L20.0794 17.153L21.2585 18.2311V20.9909H17.2181C16.9297 21.4111 16.4459 21.6868 15.8978 21.6868C15.3499 21.6867 14.8668 21.4109 14.5781 20.9909H10.5234V18.2305L11.7051 17.151L11.7122 13.7513C11.7131 11.2358 13.9154 9.70446 15.8991 9.70312Z"
        fill="white"
      />
    </svg>
  );
};
