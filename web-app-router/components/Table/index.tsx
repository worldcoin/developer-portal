import React, { useState } from "react";
import { CaretIcon } from "../Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import clsx from "clsx";

type TableProps = {
  headers: (React.ReactNode | null | undefined)[];
  rows: React.ReactNode[][];
  totalResults: number;
  rowsPerPageOptions: number[];
  initialRowsPerPage?: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  currentPage: number;
};

export const TableComponent: React.FC<TableProps> = ({
  headers,
  rows,
  totalResults,
  rowsPerPageOptions,
  initialRowsPerPage = rowsPerPageOptions[0],
  onPageChange,
  onRowsPerPageChange,
  currentPage,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    onRowsPerPageChange(newRowsPerPage);
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  // Calculate the number of pages
  const pageCount = Math.ceil(totalResults / rowsPerPage);

  return (
    <div className="w-full h-full">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="h-full sticky top-0 bg-white">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="py-3 text-left text-xs font-[400] text-gray-400 "
              >
                {header === null || header === undefined ? null : header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100 overflow-y-scroll">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-grey-25 text-grey-500 text-xs"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-4 whitespace-nowrap ">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sticky bottom-0 bg-white w-full grid grid-cols-3 text-xs items-center justify-between gap-x-4 py-4 border-t-[1px] border-gray-100">
        <div className="text-grey-400">{totalResults} results</div>
        <div className="flex items-center justify-center gap-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={clsx(
              "w-8 h-8 border flex items-center justify-center group rounded-lg border-grey-200 cursor-pointer",
              {
                "disabled:opacity-50 cursor-not-allowed": currentPage === 1,
                "hover:border-grey-700 hover:text-border-grey-700":
                  currentPage !== 1,
              }
            )}
          >
            <CaretIcon
              className={clsx("rotate-90 text-grey-400 h-4 w-4", {
                "group-hover:text-grey-700": currentPage !== 1,
              })}
            />
          </button>
          <div className="w-8 h-8 text-center border flex items-center justify-center rounded-lg border-grey-200 text-grey-900">
            {currentPage}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            className={clsx(
              "w-8 h-8 border flex items-center justify-center group rounded-lg border-grey-200 cursor-pointer",
              {
                "disabled:opacity-50 cursor-not-allowed":
                  currentPage === pageCount,
                "hover:border-grey-700 hover:text-border-grey-700":
                  currentPage < pageCount,
              }
            )}
          >
            <CaretIcon
              className={clsx("-rotate-90 text-grey-400 h-4 w-4", {
                "group-hover:text-grey-700": currentPage !== 1,
              })}
            />
          </button>
        </div>
        <div className="flex w-full justify-end">
          <PaginationSelect
            value={rowsPerPage}
            handleSelect={handleRowsPerPageChange}
          />
        </div>
      </div>
    </div>
  );
};

const PaginationDisplayOptions = [10, 20, 50];

const PaginationSelect = (props: {
  value: number;
  handleSelect: (value: number) => void;
  className?: string;
}) => {
  const { value, handleSelect, className } = props;
  return (
    <Select
      value={value}
      onChange={handleSelect}
      by={(a: number | null, b: number | null) => a === b}
    >
      <SelectButton
        className={clsx(
          "text-left items-center text-xs",
          "grid grid-cols-1fr/auto border-grey-200 border rounded-lg px-2 text-grey-700 h-8 w-20",
          className
        )}
      >
        {PaginationDisplayOptions[value] ?? value.toString()}
        <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700 w-4 h-4" />
      </SelectButton>

      <SelectOptions
        className={clsx(
          "mt-2 text-xs focus:ring-0 focus:outline-none max-h-24"
        )}
      >
        {PaginationDisplayOptions.map((option, index) => (
          <SelectOption key={index} value={option} className="hover:bg-grey-50">
            <div className="grid grid-cols-1fr/auto ">
              {PaginationDisplayOptions[index]}
            </div>
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  );
};
