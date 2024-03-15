import { lazy, ReactNode, useContext } from "react";
import { dropdownContext } from "@/components/Dropdown";

export type ItemsProps = {
  className?: string;
  children: ReactNode;
};

const ItemsDesktopComponent = lazy(
  () => import("@/components/Dropdown@desktop/Items@desktop"),
);
const ItemsMobileComponent = lazy(
  () => import("@/components/Dropdown@mobile/Items@mobile"),
);

export const Items = (props: ItemsProps) => {
  const { className } = props;
  const { isDesktop } = useContext(dropdownContext);

  const ItemsComponent = isDesktop
    ? ItemsDesktopComponent
    : ItemsMobileComponent;

  return (
    <ItemsComponent className={className}>{props.children}</ItemsComponent>
  );
};
