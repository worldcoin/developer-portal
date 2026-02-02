export const CheckIcon = ({
  className,
  size = "16",
  variant = "default",
}: {
  className?: string;
  size: "16" | "28";
  variant?: "default" | "shortTail";
}) => {
  if (size === "16") {
    const path =
      variant === "shortTail"
        ? "M3.33 8.83L6.4 11.92L12.67 4.08"
        : "M3.33301 9.33301L5.66634 11.6663L12.6663 4.33301";
    return (
      <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (size === "28") {
    const path =
      variant === "shortTail"
        ? "M5.83 15.47L11.2 20.86L22.18 7.14"
        : "M6.29999 16.2L10.15 20.05L21.7 7.95001";
    return (
      <svg
        className={className}
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="3.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
};
