export const CloseIcon = (props: { className?: string }) => {
  const { className } = props;

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
        d="M12.6663 3.33374L3.33301 12.6671M3.33301 3.33374L12.6663 12.6671"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
