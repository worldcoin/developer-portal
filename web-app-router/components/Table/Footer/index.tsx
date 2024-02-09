import clsx from "clsx";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Button } from "@/components/Button";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";

type FooterProps = {
  totalResults: number;
  currentPage: number;
  rowsPerPageOptions: number[];
  rowsPerPage: number;
  handlePageChange: (page: number) => void;
  handleRowsPerPageChange: (rowsPerPage: number) => void;
};

export const Footer: React.FC<FooterProps> = ({
  totalResults,
  currentPage,
  rowsPerPageOptions,
  rowsPerPage,
  handlePageChange,
  handleRowsPerPageChange,
}) => {
  const pageCount = Math.max(1, Math.ceil(totalResults / rowsPerPage));

  return (
    <div className="sticky bottom-0 bg-white w-full grid grid-cols-3 text-xs items-center justify-between gap-x-4 py-4 border-t-[1px] border-grey-100">
      <div className="text-grey-400">{totalResults} results</div>
      <div className="flex items-center justify-center gap-x-4">
        <Button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            "w-8 h-8 border flex items-center justify-center group rounded-lg border-grey-200 cursor-pointer",
            {
              "disabled:opacity-50 cursor-not-allowed": currentPage === 1,
              "hover:border-grey-700 hover:text-border-grey-700":
                currentPage !== 1,
            },
          )}
        >
          <CaretIcon
            className={clsx("rotate-90 text-grey-400 h-4 w-4", {
              "group-hover:text-grey-700": currentPage !== 1,
            })}
          />
        </Button>
        <div className="w-8 h-8 text-center border flex items-center justify-center rounded-lg border-grey-200 text-grey-900">
          {currentPage}
        </div>
        <Button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className={clsx(
            "w-8 h-8 border flex items-center justify-center group rounded-lg border-grey-200 cursor-pointer",
            {
              "disabled:opacity-50 cursor-not-allowed":
                currentPage === pageCount,
              "hover:border-grey-700 hover:text-border-grey-700":
                currentPage < pageCount,
            },
          )}
        >
          <CaretIcon
            className={clsx("-rotate-90 text-grey-400 h-4 w-4", {
              "group-hover:text-grey-700": currentPage !== 1,
            })}
          />
        </Button>
      </div>
      <div className="flex w-full justify-end ">
        <PaginationSelect
          rowsPerPageOptions={rowsPerPageOptions}
          value={rowsPerPage}
          handleSelect={handleRowsPerPageChange}
        />
      </div>
    </div>
  );
};

const PaginationSelect = (props: {
  value: number;
  rowsPerPageOptions: number[];
  handleSelect: (value: number) => void;
  className?: string;
}) => {
  const { value, rowsPerPageOptions, handleSelect, className } = props;
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
          className,
        )}
      >
        {rowsPerPageOptions[value] ?? value.toString()}
        <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700 w-4 h-4" />
      </SelectButton>

      <SelectOptions
        className={clsx(
          "mt-1 text-xs focus:ring-0 focus:outline-none max-h-24 mb-2",
        )}
      >
        {rowsPerPageOptions.map((option, index) => (
          <SelectOption key={index} value={option} className="hover:bg-grey-50">
            <div className="grid grid-cols-1fr/auto ">
              {rowsPerPageOptions[index]}
            </div>
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  );
};
