import { lazy, ReactNode, useContext } from "react";
import { dropdownContext } from "@/components/Dropdown";

export type ButtonProps = {
  className?: string;
  children: ReactNode;
};

const ButtonDesktopComponent = lazy(
  () => import("@/components/Dropdown@desktop/Button@desktop"),
);
const ButtonMobileComponent = lazy(
  () => import("@/components/Dropdown@mobile/Button@mobile"),
);

export const Button = (props: ButtonProps) => {
  const { className } = props;

  const { isDesktop } = useContext(dropdownContext);

  const ButtonComponent = isDesktop
    ? ButtonDesktopComponent
    : ButtonMobileComponent;

  return (
    <ButtonComponent className={className}>{props.children}</ButtonComponent>
  );
};
