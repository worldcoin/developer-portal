import clsx from "clsx";
import { memo } from "react";

export const Status = memo(function Status(props: { isActive: boolean }) {
  const { isActive } = props;

  return (
    <span
      className={clsx("truncate font-world text-15 leading-[1.2] font-[350]", {
        "text-[#00c230]": isActive,
        "text-[#808080]": !isActive,
      })}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
});
