import { ComponentProps, memo } from "react";

export const TrashIcon = memo(function TrashIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 11.5254L40.0273 11.5059L40.0371 15.5059L37.873 15.5098L33.7266 44.0039H14.25L10.4023 15.5781L8.14258 15.584L8.13477 11.584L16 11.5645V3.99805H32.0039L32 11.5254ZM20 11.5547L28 11.5352L28.002 7.99805H20V11.5547Z"
        fill="currentColor"
      />
    </svg>
  );
});
