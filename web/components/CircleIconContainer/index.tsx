import clsx from "clsx";
import { ReactNode } from "react";

type Variant = "error" | "info" | "success" | "muted" | "warning";

export type CircleIconContainerProps = {
  children: ReactNode;
  variant: Variant;
};

type ThemeItem = {
  gradient: string;
  outline: string;
  shadowMatrix: string;
};

export const CircleIconContainer = (props: CircleIconContainerProps) => {
  const theme: Record<Variant, ThemeItem> = {
    error: {
      gradient: "#FFCBC5",
      outline: "#FFE5E2",
      shadowMatrix: "0 0 0 0 1 0 0 0 0 0.796078 0 0 0 0 0.772549 0 0 0 0.45 0",
    },
    info: {
      gradient: "#4940E0",
      outline: "#DCD9FD",
      shadowMatrix:
        "0 0 0 0 0.862745 0 0 0 0 0.85098 0 0 0 0 0.992157 0 0 0 0.08 0",
    },
    success: {
      gradient: "#BCEBBC",
      outline: "#BCEBBC",
      shadowMatrix:
        "0 0 0 0 0.737255 0 0 0 0 0.921569 0 0 0 0 0.737255 0 0 0 0.45 0",
    },
    muted: {
      gradient: "#EBECEF",
      outline: "#EBECEF",
      shadowMatrix:
        "0 0 0 0 0.921569 0 0 0 0 0.92549 0 0 0 0 0.937255 0 0 0 0.45 0",
    },
    warning: {
      gradient: "#FFE5E2",
      outline: "#FFE5E2",
      shadowMatrix:
        "0 0 0 0 0.921569 0 0 0 0 0.92549 0 0 0 0 0.937255 0 0 0 0.45 0",
    },
  };

  return (
    <div className="relative size-[5.5rem]">
      <svg
        width="88"
        height="88"
        viewBox="0 0 88 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="44"
          cy="44"
          r="43.45"
          fill="url(#paint0_linear_133_316)"
          fillOpacity="0.65"
          stroke="url(#paint1_linear_133_316)"
          strokeWidth="1.1"
        />
        <g filter="url(#filter0_d_133_316)">
          <circle cx="44.0002" cy="44.0002" r="30.8" fill="white" />
          {/* NOTE: outline color */}
          <circle
            cx="44.0002"
            cy="44.0002"
            r="30.3"
            stroke={theme[props.variant].outline}
          />
        </g>
        <defs>
          <filter
            id="filter0_d_133_316"
            x="9.9002"
            y="11.5502"
            width="68.1996"
            height="68.2001"
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
            <feOffset dy="1.65" />
            <feGaussianBlur stdDeviation="1.65" />
            {/* NOTE: Shadow matrix color */}
            <feColorMatrix
              type="matrix"
              values={theme[props.variant].shadowMatrix}
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_133_316"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_133_316"
              result="shape"
            />
          </filter>
          <linearGradient
            id="paint0_linear_133_316"
            x1="44"
            y1="0"
            x2="44"
            y2="88"
            gradientUnits="userSpaceOnUse"
          >
            {/* NOTE: Gradient color */}
            <stop stopColor={theme[props.variant].gradient} />
            <stop
              offset="1"
              stopColor={theme[props.variant].gradient}
              stopOpacity="0"
            />
          </linearGradient>
          <linearGradient
            id="paint1_linear_133_316"
            x1="44"
            y1="0"
            x2="44"
            y2="88"
            gradientUnits="userSpaceOnUse"
          >
            {/* NOTE: Gradient color */}
            <stop stopColor={theme[props.variant].gradient} />
            <stop
              offset="0.713291"
              stopColor={theme[props.variant].gradient}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
      </svg>

      <div
        className={clsx(
          "absolute inset-0 flex max-h-[88px] max-w-[88px] items-center justify-center",
          {
            "text-system-error-500": props.variant === "error",
            "text-blue-500": props.variant === "info",
            "text-system-success-500": props.variant === "success",
            "text-grey-400": props.variant === "muted",
            "text-system-warning-600": props.variant === "warning",
          },
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
