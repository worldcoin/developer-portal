import { ComponentProps } from "react";

export const NoteEditIcon = (props: ComponentProps<"svg">) => {
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
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
        d="M8.75 18.333h-.833c-2.75 0-4.125 0-4.98-.854-.854-.854-.854-2.23-.854-4.979V8.333c0-2.75 0-4.124.855-4.979C3.792 2.5 5.167 2.5 7.917 2.5h2.5c2.75 0 4.124 0 4.979.854.854.855.854 2.23.854 4.98v.833"
      ></path>
      <path
        fill="#fff"
        d="M14.857 12.336c.278-.278.417-.417.561-.5a1.27 1.27 0 0 1 1.268 0c.144.083.283.222.56.5.279.278.418.417.5.561.227.392.227.875 0 1.267-.082.145-.221.284-.5.562l-2.756 2.756c-.55.55-1.382.573-2.117.73-.575.123-.862.185-1.025.022-.162-.162-.1-.45.022-1.024.158-.736.18-1.567.73-2.118z"
      ></path>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
        d="M13.333 1.666v1.667M9.167 1.666v1.667M5 1.666v1.667"
      ></path>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="1.25"
        d="M5.833 12.499h3.334M5.833 8.332H12.5"
      ></path>
    </svg>
  );
};
