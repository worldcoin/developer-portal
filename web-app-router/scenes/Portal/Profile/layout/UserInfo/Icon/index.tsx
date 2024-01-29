import { CSSProperties, HTMLAttributes } from "react";
import { ColorName, colors } from "@/scenes/Portal/Profile/types";

export type IconProps = Omit<HTMLAttributes<HTMLElement>, "color"> & {
  color: ColorName;
  name: string;
};

export const Icon = (props: IconProps) => {
  const { className, color, name, ...otherProps } = props;
  return (
    <div
      className="relative w-20 h-20"
      {...otherProps}
      style={
        {
          "--color-100": colors[color]["100"],
          "--color-500": colors[color]["500"],
        } as CSSProperties
      }
    >
      <svg
        className="absolute top-0 left-[-6px]"
        width="92"
        height="90"
        viewBox="0 0 92 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.56">
          <g opacity="0.4" filter="url(#filter0_f_143_500)">
            <path
              d="M46 80C65.8823 80 82 78.2091 82 76C82 73.7909 65.8823 72 46 72C26.1177 72 10 73.7909 10 76C10 78.2091 26.1177 80 46 80Z"
              style={{ fill: "var(--color-500)" }}
            />
          </g>
          <g opacity="0.9" filter="url(#filter1_f_143_500)">
            <path
              d="M46.003 76.4462C60.3182 76.4462 71.923 75.6503 71.923 74.6684C71.923 73.6866 60.3182 72.8906 46.003 72.8906C31.6878 72.8906 20.083 73.6866 20.083 74.6684C20.083 75.6503 31.6878 76.4462 46.003 76.4462Z"
              style={{ fill: "var(--color-500)" }}
            />
          </g>
          <g opacity="0.3" filter="url(#filter2_f_143_500)">
            <path
              d="M46.0005 76.444C56.737 76.444 65.4405 75.8471 65.4405 75.1107C65.4405 74.3743 56.737 73.7773 46.0005 73.7773C35.2641 73.7773 26.5605 74.3743 26.5605 75.1107C26.5605 75.8471 35.2641 76.444 46.0005 76.444Z"
              style={{ fill: "var(--color-500)" }}
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_143_500"
            x="0.88624"
            y="62.8862"
            width="90.2275"
            height="26.2275"
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
              result="effect1_foregroundBlur_143_500"
            />
          </filter>
          <filter
            id="filter1_f_143_500"
            x="15.4897"
            y="68.2973"
            width="61.0264"
            height="12.7423"
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
              result="effect1_foregroundBlur_143_500"
            />
          </filter>
          <filter
            id="filter2_f_143_500"
            x="25.795"
            y="73.0118"
            width="40.411"
            height="4.1976"
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
              result="effect1_foregroundBlur_143_500"
            />
          </filter>
        </defs>
      </svg>

      <svg
        className="relative"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="4"
          y="4"
          width="71.9999"
          height="72"
          rx="16"
          style={{ fill: "var(--color-100)" }}
        />
        <rect
          x="4"
          y="4"
          width="71.9999"
          height="72"
          rx="16"
          fill="url(#paint0_radial_143_482)"
          fillOpacity="0.24"
        />
        <defs>
          <radialGradient
            id="paint0_radial_143_482"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(40 4) rotate(90) scale(72 71.9999)"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center font-550 text-24"
        style={{ color: "var(--color-500)" }}
      >
        {name && name[0]}
      </div>
    </div>
  );
};
