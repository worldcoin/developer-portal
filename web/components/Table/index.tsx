import React from "react";

type TableProps = {
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const Table: React.FC<TableProps> = ({ children, footer }) => {
  return (
    <div className="size-full">
      <table className="min-w-full divide-y divide-grey-100">{children}</table>
      {footer}
    </div>
  );
};
