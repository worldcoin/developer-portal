import clsx from "clsx";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type USDCIconIconProps = {
  className?: string;
};

export const USDCIcon = memo(function Icon(props: USDCIconIconProps) {
  const { className } = props;

  return (
    <div className={twMerge(clsx(`flex size-6 items-center`, className))}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="12" fill="#0658FF" />
        <path
          d="M10.044 19.1296C10.044 19.3904 9.86618 19.4774 9.59951 19.4774C6.31062 18.434 3.99951 15.4779 3.99951 12C3.99951 8.52215 6.31062 5.56597 9.59951 4.52262C9.86618 4.43567 10.044 4.60956 10.044 4.8704V5.47903C10.044 5.65292 9.95507 5.82681 9.77729 5.91376C7.19951 6.87017 5.42173 9.21772 5.42173 12C5.42173 14.7823 7.2884 17.2168 9.77729 18.0862C9.95507 18.1732 10.044 18.3471 10.044 18.521V19.1296Z"
          fill="white"
        />
        <path
          d="M12.7109 16.9559C12.7109 17.1298 12.5331 17.3037 12.3553 17.3037H11.6442C11.4664 17.3037 11.2887 17.1298 11.2887 16.9559V15.9126C9.86645 15.7387 9.15534 14.9562 8.88867 13.8259C8.88867 13.652 8.97756 13.4781 9.15534 13.4781H9.95534C10.1331 13.4781 10.222 13.565 10.3109 13.7389C10.4887 14.3475 10.8442 14.8692 11.9998 14.8692C12.8887 14.8692 13.5109 14.4345 13.5109 13.7389C13.5109 13.0433 13.1553 12.7825 11.9109 12.6086C10.0442 12.3478 9.15534 11.8261 9.15534 10.348C9.15534 9.2177 10.0442 8.34824 11.2887 8.17434V7.13099C11.2887 6.9571 11.4664 6.7832 11.6442 6.7832H12.3553C12.5331 6.7832 12.7109 6.9571 12.7109 7.13099V8.17434C13.7776 8.34824 14.4887 8.95686 14.6664 9.91327C14.6664 10.0872 14.5776 10.2611 14.3998 10.2611H13.6887C13.5109 10.2611 13.422 10.1741 13.3331 10.0002C13.1553 9.39159 12.7109 9.13075 11.9109 9.13075C11.022 9.13075 10.5776 9.56549 10.5776 10.1741C10.5776 10.7827 10.8442 11.1305 12.1776 11.3044C14.0442 11.5653 14.9331 12.0869 14.9331 13.565C14.9331 14.6953 14.0442 15.6517 12.7109 15.9126V16.9559V16.9559Z"
          fill="white"
        />
        <path
          d="M14.3995 19.4763C14.1329 19.5632 13.9551 19.3893 13.9551 19.1285V18.5198C13.9551 18.3459 14.044 18.1721 14.2217 18.0851C16.7995 17.1287 18.5773 14.7812 18.5773 11.9989C18.5773 9.21659 16.7106 6.78209 14.2217 5.91263C14.044 5.82568 13.9551 5.65179 13.9551 5.47789V4.86927C13.9551 4.60843 14.1329 4.52148 14.3995 4.52148C17.5995 5.56484 19.9995 8.52102 19.9995 11.9989C19.9995 15.4767 17.6884 18.4329 14.3995 19.4763Z"
          fill="white"
        />
      </svg>
    </div>
  );
});
