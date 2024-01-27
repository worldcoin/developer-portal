import { ReactNode } from "react";
import { Slide, ToastContainer } from "react-toastify";

export const TeamIdLayout = (props: { children: ReactNode }) => (
  <div>
    <ToastContainer autoClose={5000} transition={Slide} />
    {props.children}
  </div>
);
