export const PlusIcon = (props: { className: string }) => {
  const { className } = props;
  return (
    <svg
      width="12"
      height="12"
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="plus">
        <path
          id="Union"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.625 1C6.625 0.654822 6.34518 0.375 6 0.375C5.65482 0.375 5.375 0.654822 5.375 1V5.375H1C0.654822 5.375 0.375 5.65482 0.375 6C0.375 6.34518 0.654822 6.625 1 6.625H5.375V11C5.375 11.3452 5.65482 11.625 6 11.625C6.34518 11.625 6.625 11.3452 6.625 11V6.625H11C11.3452 6.625 11.625 6.34518 11.625 6C11.625 5.65482 11.3452 5.375 11 5.375H6.625V1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
