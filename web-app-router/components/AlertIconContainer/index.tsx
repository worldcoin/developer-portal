import { ReactNode } from 'react'

type AlertIconContainerProps = {
  children: ReactNode
}

export const AlertIconContainer = (props: AlertIconContainerProps) => {
  return (
    <div className="relative w-[5.5rem] h-[5.5rem]">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="44" cy="44" r="43.45" fill="url(#paint0_linear_133_316)" fillOpacity="0.65" stroke="url(#paint1_linear_133_316)" strokeWidth="1.1"/>
        <g filter="url(#filter0_d_133_316)">
          <circle cx="44.0002" cy="44.0002" r="30.8" fill="white"/>
          <circle cx="44.0002" cy="44.0002" r="30.3" stroke="#FFE5E2"/>
        </g>
        <defs>
          <filter id="filter0_d_133_316" x="9.9002" y="11.5502" width="68.1996" height="68.2001" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="1.65"/>
            <feGaussianBlur stdDeviation="1.65"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.796078 0 0 0 0 0.772549 0 0 0 0.45 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_133_316"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_133_316" result="shape"/>
          </filter>
          <linearGradient id="paint0_linear_133_316" x1="44" y1="0" x2="44" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFCBC5"/>
            <stop offset="1" stopColor="#FFCBC5" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint1_linear_133_316" x1="44" y1="0" x2="44" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFCBC5"/>
            <stop offset="0.713291" stopColor="#FFCBC5" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-system-error-500">
        {props.children}
      </div>
    </div>
  )
}
