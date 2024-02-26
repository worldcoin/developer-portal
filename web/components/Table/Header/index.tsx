import React from "react";

type HeaderProps = {
  headers: (React.ReactNode | null | undefined)[];
};

export const Header: React.FC<HeaderProps> = ({ headers }) => {
  return (
    <thead className="sticky top-0 h-full bg-white">
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            scope="col"
            className="py-3 text-left text-xs font-[400] text-grey-400 "
          >
            {header === null || header === undefined ? null : header}
          </th>
        ))}
      </tr>
    </thead>
  );
};
