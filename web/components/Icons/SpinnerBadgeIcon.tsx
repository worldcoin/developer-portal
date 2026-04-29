import { ComponentProps } from "react";

export const SpinnerBadgeIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...props}
    >
      {/* Center artwork on viewBox (9,9) so animate-spin rotates without wobble */}
      <g transform="translate(0.375 0.375)">
        <rect
          width="16.125"
          height="16.125"
          x="0.563"
          y="0.563"
          fill="#fff"
          rx="8.063"
        ></rect>
        <rect
          width="16.125"
          height="16.125"
          x="0.563"
          y="0.563"
          stroke="#fff"
          strokeWidth="1.125"
          rx="8.063"
        ></rect>
        <circle
          cx="8.625"
          cy="8.625"
          r="6.75"
          stroke="#191C20"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        ></circle>
        <path
          fill="#181818"
          d="M12.308 2.091a7.5 7.5 0 0 0-7.226-.076l.702 1.31a6.01 6.01 0 0 1 5.794.061z"
        ></path>
      </g>
    </svg>
  );
};
