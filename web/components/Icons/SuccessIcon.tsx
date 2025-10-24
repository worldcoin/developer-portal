import clsx from "clsx";
import { memo } from "react";

type SuccessIconProps = {
  className?: string;
};
export const SuccessIcon = memo(function SuccessIcon(props: SuccessIconProps) {
  const { className } = props;
  return (
    <div className={clsx("size-6", className)}>
      <svg
        className="size-full"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.0007 36.6668C29.2054 36.6668 36.6673 29.2049 36.6673 20.0002C36.6673 10.7954 29.2054 3.3335 20.0007 3.3335C10.7959 3.3335 3.33398 10.7954 3.33398 20.0002C3.33398 29.2049 10.7959 36.6668 20.0007 36.6668ZM27.654 15.7676C28.0779 15.2227 27.9797 14.4374 27.4348 14.0135C26.8898 13.5897 26.1045 13.6879 25.6806 14.2328L19.0023 22.8192C18.8538 23.0102 18.5745 23.0349 18.3947 22.8731L14.1702 19.0711C13.6571 18.6093 12.8667 18.6509 12.4049 19.164C11.9431 19.6772 11.9847 20.4675 12.4978 20.9293L16.7223 24.7314C17.9808 25.8641 19.9362 25.6906 20.9757 24.3541L27.654 15.7676Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
});
