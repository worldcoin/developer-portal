import { ComponentProps } from "react";

export const TrophyIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        stroke="#fff"
        strokeWidth="1.25"
        d="M13.973 4.602s.894-.837 1.637-.851c2.443-.049 2.275 2.685.87 3.964-1.367 1.246-3.357 2.73-3.98 3.118M6.027 4.602s-.894-.837-1.637-.851c-2.443-.049-2.275 2.685-.87 3.964 1.367 1.246 3.357 2.73 3.98 3.118"
      ></path>
      <path
        fill="#fff"
        d="M15 2.082s-.675 10.099-3.838 12.14c1.233.6 3.004 1.793 3.004 3.694H5.833c0-1.9 1.77-3.093 3.003-3.693-1.363-.88-2.264-3.256-2.848-5.675C5.218 5.357 5.001 2.09 5 2.082z"
      ></path>
    </svg>
  );
};
