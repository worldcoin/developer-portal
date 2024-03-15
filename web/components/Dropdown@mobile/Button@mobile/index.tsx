import { useContext } from "react";
import { twMerge } from "tailwind-merge";
import { ButtonProps } from "@/components/Dropdown/Button";
import { dropdownMobileContext } from "components/Dropdown@mobile";

export const Button = (props: ButtonProps) => {
  const { className, ...otherProps } = props;
  const { setOpen } = useContext(dropdownMobileContext)!;
  return (
    <button
      className={twMerge(className)}
      onClick={() => setOpen(true)}
      {...otherProps}
    />
  );
};

export default Button;
