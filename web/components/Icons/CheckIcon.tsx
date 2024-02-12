export const CheckIcon = ({
  className,
  size = "16",
}: {
  className?: string;
  size: "16" | "28";
}) => {
  if (size === "16") {
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
          d="M3.33301 9.33301L5.66634 11.6663L12.6663 4.33301"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (size === "28") {
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
          d="M6.29999 16.2L10.15 20.05L21.7 7.95001"
          stroke="currentColor"
          stroke-width="3.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    );
  }
};
