export const CaretIcon = (props: { className?: string }) => {
  const { className } = props;
  return (
    <svg
      className={`stroke-current ${className}`}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 7.5L9.29289 11.7929C9.62623 12.1262 9.79289 12.2929 10 12.2929C10.2071 12.2929 10.3738 12.1262 10.7071 11.7929L15 7.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
