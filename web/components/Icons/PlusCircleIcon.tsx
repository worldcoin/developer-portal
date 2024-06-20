import { ComponentProps } from "react";

export const PlusCircleIcon = (
  props: ComponentProps<"svg"> & { variant?: "primary" | "secondary" },
) => {
  const { variant = "primary" } = props;

  return (
    <>
      {variant === "primary" && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <g clipPath="url(#clip0_1982_45953)">
            <path
              d="M9.99935 6.66699L9.99935 13.3337M13.3327 10.0003L6.66602 10.0003"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="9.99935"
              cy="10.0003"
              r="8.33333"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </g>
          <defs>
            <clipPath id="clip0_1982_45953">
              <rect width="20" height="20" fill="currentColor" />
            </clipPath>
          </defs>
        </svg>
      )}

      {variant === "secondary" && (
        <div className="size-5 shadow-[0_1_2px_0_#191c20]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.5"
              y="0.5"
              width="19"
              height="19"
              rx="9.5"
              fill="#3C424B"
            />
            <rect
              x="0.5"
              y="0.5"
              width="19"
              height="19"
              rx="9.5"
              stroke="#EBECEF"
            />
            <path
              d="M10 4.66666V15.3333"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.66666 10H15.3333"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </>
  );
};
