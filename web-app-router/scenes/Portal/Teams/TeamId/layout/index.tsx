import { ReactNode } from "react";
import { Slide, ToastContainer } from "react-toastify";

export const TeamIdLayout = (props: { children: ReactNode }) => (
  <div>
    <ToastContainer
      autoClose={4000}
      transition={Slide}
      hideProgressBar
      position="bottom-right"
    />
    {props.children}
  </div>
);
