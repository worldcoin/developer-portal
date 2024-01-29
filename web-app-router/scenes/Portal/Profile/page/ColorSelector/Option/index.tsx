import { ButtonHTMLAttributes, CSSProperties } from "react";
import { ColorName, colors } from "@/scenes/Portal/Profile/types";
import clsx from "clsx";

export type OptionProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> & {
  value: ColorName;
  selected: boolean;
};

export const Option = (props: OptionProps) => {
  const { className, value, selected, ...otherProps } = props;
  return (
    <button
      type="button"
      className={clsx("cursor-pointer", className)}
      {...otherProps}
      style={
        {
          "--color-100": colors[value]["100"],
          "--color-500": colors[value]["500"],
        } as CSSProperties
      }
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_144_510)">
          <g opacity="0.4">
            <rect
              width="24"
              height="24"
              rx="12"
              style={{
                fill: "var(--color-500)",
                opacity: selected ? "1" : "0.6",
              }}
            />
            <g filter="url(#filter0_d_144_510)">
              <circle
                cx="12"
                cy="12"
                r="9"
                style={{ fill: "var(--color-100)" }}
              />
            </g>
          </g>
        </g>
        <defs>
          <filter
            id="filter0_d_144_510"
            x="0.6"
            y="3"
            width="22.8"
            height="22.8"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="2.4" />
            <feGaussianBlur stdDeviation="1.2" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.105882 0 0 0 0 0.109804 0 0 0 0 0.113725 0 0 0 0.12 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_144_510"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_144_510"
              result="shape"
            />
          </filter>
          <clipPath id="clip0_144_510">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </button>
  );
};
