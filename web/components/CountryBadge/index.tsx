import { ReactNode } from "react";

type CountryBadgeProps = {
  children: ReactNode;
  onClick?: () => void;
};

export const CountryBadge = (props: CountryBadgeProps) => {
  return (
    <div
      onClick={props.onClick}
      className="grid cursor-pointer grid-cols-auto/1fr items-center gap-x-2 rounded-2xl border border-grey-70 px-2.5 py-1.5 hover:bg-grey-100"
    >
      {props.children}
    </div>
  );
};
