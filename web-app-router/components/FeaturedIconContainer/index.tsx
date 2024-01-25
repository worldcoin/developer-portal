import { ReactNode } from 'react'

type FeaturedIconContainerProps = {
  children: ReactNode
}

export const FeaturedIconContainer = (props: FeaturedIconContainerProps) => {
  return (
    <div className="relative w-[5.5rem] h-[5.5rem]">
      <svg width="89" height="88" viewBox="0 0 89 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="44.959" cy="44" r="43.45" fill="url(#paint0_linear_131_490)" fillOpacity="0.65" stroke="url(#paint1_linear_131_490)" strokeWidth="1.1"/>
        <g filter="url(#filter0_d_131_490)">
          <circle cx="44.9592" cy="44.0002" r="30.8" fill="white"/>
          <circle cx="44.9592" cy="44.0002" r="30.3" stroke="#DCD9FD"/>
        </g>
        <defs>
          <filter id="filter0_d_131_490" x="11.1592" y="11.7002" width="67.5996" height="67.6001" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="1.5"/>
            <feGaussianBlur stdDeviation="1.5"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.862745 0 0 0 0 0.85098 0 0 0 0 0.992157 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_131_490"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_131_490" result="shape"/>
          </filter>
          <linearGradient id="paint0_linear_131_490" x1="44.959" y1="0" x2="44.959" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DCD9FD"/>
            <stop offset="1" stopColor="#DCD9FD" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint1_linear_131_490" x1="44.959" y1="0" x2="44.959" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DCD9FD"/>
            <stop offset="0.713291" stopColor="#DCD9FD" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-blue-500">
        {props.children}
      </div>
    </div>
  )
}
