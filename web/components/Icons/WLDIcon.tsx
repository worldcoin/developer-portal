import clsx from "clsx";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type USDCIconIconProps = {
  className?: string;
};

export const WLDIcon = memo(function WLDIcon(props: USDCIconIconProps) {
  const { className } = props;

  return (
    <div className={twMerge(clsx(`size-6`, className))}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14" cy="14" r="14" fill="#191C20" />
        <rect
          opacity="0.3"
          width="28"
          height="28"
          rx="14"
          fill="url(#paint0_radial_51037_38045)"
        />
        <path
          d="M20.3146 11.3993C19.9777 10.6031 19.4963 9.88957 18.8829 9.27614C18.2695 8.66271 17.5545 8.18118 16.76 7.84426C15.9353 7.49464 15.0613 7.31824 14.1587 7.31824C13.2578 7.31824 12.3822 7.49464 11.5575 7.84426C10.7614 8.18118 10.048 8.66271 9.4346 9.27614C8.82124 9.88957 8.33976 10.6047 8.00289 11.3993C7.6549 12.2225 7.47852 13.0982 7.47852 13.9993C7.47852 14.9003 7.6549 15.776 8.00448 16.6008C8.34135 17.397 8.82282 18.1105 9.43619 18.724C10.0495 19.3374 10.7646 19.8189 11.5591 20.1558C12.3838 20.5039 13.2578 20.6819 14.1603 20.6819C15.0613 20.6819 15.9369 20.5055 16.7616 20.1558C17.5577 19.8189 18.2711 19.3374 18.8845 18.724C19.4978 18.1105 19.9793 17.3954 20.3162 16.6008C20.6642 15.776 20.8422 14.9019 20.8422 13.9993C20.8406 13.0982 20.6626 12.2225 20.3146 11.3993ZM11.9405 13.3715C12.2186 12.3036 13.191 11.5137 14.3463 11.5137H18.9846C19.2833 12.0906 19.474 12.7184 19.5487 13.3715H11.9405ZM19.5487 14.627C19.474 15.2802 19.2817 15.9079 18.9846 16.4848H14.3463C13.1926 16.4848 12.2201 15.6949 11.9405 14.627H19.5487ZM10.3229 10.1629C11.3478 9.13788 12.7096 8.57371 14.1587 8.57371C15.6079 8.57371 16.9697 9.13788 17.9946 10.1629C18.0264 10.1947 18.0566 10.2265 18.0868 10.2583H14.3463C13.3468 10.2583 12.4076 10.6476 11.7005 11.3548C11.1444 11.911 10.7853 12.6119 10.6566 13.3731H8.77039C8.90863 12.1605 9.44731 11.0386 10.3229 10.1629ZM14.1587 19.4264C12.7096 19.4264 11.3478 18.8622 10.3229 17.8372C9.44731 16.9615 8.90863 15.8396 8.77039 14.6286H10.6566C10.7837 15.3898 11.1444 16.0907 11.7005 16.6469C12.4076 17.3541 13.3468 17.7434 14.3463 17.7434H18.0884C18.0582 17.7752 18.0264 17.807 17.9962 17.8388C16.9713 18.8606 15.6079 19.4264 14.1587 19.4264Z"
          fill="white"
        />
        <defs>
          <radialGradient
            id="paint0_radial_51037_38045"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(6.36364) rotate(63.4349) scale(31.305 31.17)"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
