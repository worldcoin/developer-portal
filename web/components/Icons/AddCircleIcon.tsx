import { ComponentProps } from "react";

export const AddCircleIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.9987 15.1668C4.04066 15.1668 0.832031 11.9582 0.832031 8.00016C0.832031 4.04212 4.04066 0.833496 7.9987 0.833496C11.9567 0.833496 15.1654 4.04212 15.1654 8.00016C15.1654 11.9582 11.9567 15.1668 7.9987 15.1668ZM8.66536 5.3335C8.66536 4.96531 8.36689 4.66683 7.9987 4.66683C7.63051 4.66683 7.33203 4.96531 7.33203 5.3335V7.3335H5.33203C4.96384 7.3335 4.66536 7.63197 4.66536 8.00016C4.66536 8.36835 4.96384 8.66683 5.33203 8.66683H7.33203V10.6668C7.33203 11.035 7.63051 11.3335 7.9987 11.3335C8.36689 11.3335 8.66536 11.035 8.66536 10.6668V8.66683H10.6654C11.0336 8.66683 11.332 8.36835 11.332 8.00016C11.332 7.63197 11.0336 7.3335 10.6654 7.3335H8.66536V5.3335Z"
        fill="currentColor"
      />
    </svg>
  );
};
