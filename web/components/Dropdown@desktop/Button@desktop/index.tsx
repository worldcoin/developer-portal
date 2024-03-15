import { Menu } from "@headlessui/react";
import { useContext } from "react";
import { twMerge } from "tailwind-merge";
import { ButtonProps } from "@/components/Dropdown/Button";
import { dropdownDesktopContext } from "components/Dropdown@desktop";

export const Button = (props: ButtonProps) => {
  const { className, ...otherProps } = props;
  const { setReference } = useContext(dropdownDesktopContext);
  return (
    <Menu.Button
      ref={setReference}
      className={twMerge(className)}
      {...otherProps}
    />
  );
};

export default Button;
