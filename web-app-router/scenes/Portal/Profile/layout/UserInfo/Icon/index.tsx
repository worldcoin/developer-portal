import { CSSProperties, HTMLAttributes } from "react";
import { ColorName, colors } from "@/scenes/Portal/Profile/types";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export type IconProps = Omit<HTMLAttributes<HTMLElement>, "color"> & {
  color: ColorName;
  name: string;
};

export const Icon = (props: IconProps) => {
  const { className, color, name, ...otherProps } = props;
  return (
    <div
      className="relative w-[72px] h-[72px] flex justify-center items-center"
      {...otherProps}
      style={
        {
          "--color-100": colors[color]["100"],
          "--color-500": colors[color]["500"],
        } as CSSProperties
      }
    >
      <svg
        width="72"
        height="8"
        viewBox="0 0 72 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-x-0 -bottom-1"
      >
        <g opacity="0.56">
          <g opacity="0.1" filter="url(#filter0_f_11_122)">
            <ellipse cx="36" cy="4" rx="36" ry="4" fill="var(--color-500)" />
          </g>

          <g opacity="0.3" filter="url(#filter1_f_11_122)">
            <ellipse
              cx="36.0033"
              cy="2.6684"
              rx="25.92"
              ry="1.77778"
              fill="var(--color-500)"
            />
          </g>

          <g opacity="0.1" filter="url(#filter2_f_11_122)">
            <ellipse
              cx="36.0008"
              cy="3.1107"
              rx="19.44"
              ry="1.33333"
              fill="var(--color-500)"
            />
          </g>
        </g>

        <defs>
          <filter
            id="filter0_f_11_122"
            x="0.886248"
            y="1.8862"
            width="70.2275"
            height="5.2275"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />

            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />

            <feGaussianBlur
              stdDeviation="4.55688"
              result="effect1_foregroundBlur_11_122"
            />
          </filter>

          <filter
            id="filter1_f_11_122"
            x="15.4899"
            y="3.2973"
            width="51.0266"
            height="1.7421"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />

            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />

            <feGaussianBlur
              stdDeviation="2.29665"
              result="effect1_foregroundBlur_11_122"
            />
          </filter>

          <filter
            id="filter2_f_11_122"
            x="25.7952"
            y="3.0118"
            width="30.4111"
            height="1.19776"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />

            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />

            <feGaussianBlur
              stdDeviation="0.382775"
              result="effect1_foregroundBlur_11_122"
            />
          </filter>
        </defs>
      </svg>

      <svg
        className="absolute inset-0"
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0"
          y="0"
          width="71.9999"
          height="72"
          rx="36"
          fill="var(--color-100)"
        />
      </svg>

      <Typography
        variant={TYPOGRAPHY.M2}
        className="relative"
        style={{ color: "var(--color-500)" }}
      >
        {name && name[0]}
      </Typography>
    </div>
  );
};
