import { lazy, ReactNode, useContext } from "react";
import { dropdownContext } from "@/components/Dropdown";

export type ItemProps = {
  className?: string;
  preventCloseOnClick?: boolean;
  children: ReactNode;
};

const ItemDesktopComponent = lazy(
  () => import("@/components/Dropdown@desktop/Item@desktop"),
);
const ItemMobileComponent = lazy(
  () => import("@/components/Dropdown@mobile/Item@mobile"),
);

export const Item = (props: ItemProps) => {
  const { className, children } = props;
  const { isDesktop } = useContext(dropdownContext);

  const ItemComponent = isDesktop ? ItemDesktopComponent : ItemMobileComponent;

  return (
    <ItemComponent
      className={className}
      preventCloseOnClick={props.preventCloseOnClick}
    >
      {children}
    </ItemComponent>
  );
};
