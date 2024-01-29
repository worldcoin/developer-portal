import React from "react";

type BodyProps = {
  rows: React.ReactNode[][];
};

export const Body: React.FC<BodyProps> = ({ rows }) => {
  return (
    <tbody className="bg-white divide-y divide-grey-100 overflow-y-scroll">
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex} className="hover:bg-grey-25 text-grey-500 text-xs">
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className="py-4 whitespace-nowrap">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};
