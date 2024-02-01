import clsx from "clsx";
import React from "react";

type RowProps = {
  row: React.ReactNode[];
  handleOnClick?: () => void;
  className?: string;
};

export const Row = (props: RowProps) => {
  const { row, className } = props;
  return (
    <tr
      className={clsx(
        "hover:bg-grey-25 text-grey-500 text-xs w-full",
        className
      )}
      onClick={props.handleOnClick}
    >
      {row.map((cell, cellIndex) => (
        <td key={cellIndex} className="whitespace-nowrap">
          {cell}
        </td>
      ))}
    </tr>
  );
};
