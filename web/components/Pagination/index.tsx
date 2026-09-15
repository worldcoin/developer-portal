import { Button } from "@/components/Button";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type FooterProps = {
  totalResults: number;
  currentPage: number;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  handlePageChange: (page: number) => void;
  handleRowsPerPageChange?: (rowsPerPage: number) => void;
  className?: string;
};

export const Pagination: React.FC<FooterProps> = ({
  totalResults,
  currentPage,
  rowsPerPageOptions,
  rowsPerPage,
  handlePageChange,
  handleRowsPerPageChange,
  className,
}) => {
  const pageCount = Math.max(1, Math.ceil(totalResults / rowsPerPage));

  return (
    <div
      className={twMerge(
        clsx(
          "sticky bottom-0 grid w-full items-center justify-between gap-x-4 bg-surface py-4 text-xs",
          Boolean(rowsPerPageOptions) ? "grid-cols-3" : "grid-cols-2",
          className,
        ),
      )}
    >
      <div className="text-content-tertiary">{totalResults} results</div>
      <div
        className={clsx(
          "flex items-center gap-x-4",
          Boolean(rowsPerPageOptions) ? "justify-center" : "justify-end",
        )}
      >
        <Button
          type="button"
          aria-label="Previous page"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            "group flex size-8 items-center justify-center rounded-lg border border-edge",
            {
              "disabled:cursor-not-allowed disabled:opacity-50":
                currentPage === 1,
              "hover:text-border-grey-700 hover:border-edge-heavy":
                currentPage !== 1,
            },
          )}
        >
          <CaretIcon
            className={clsx("size-4 rotate-90 text-content-tertiary", {
              "group-hover:text-content-strong": currentPage !== 1,
            })}
          />
        </Button>
        <div className="flex size-8 items-center justify-center rounded-lg border border-edge text-center text-content-primary">
          {currentPage}
        </div>
        <Button
          type="button"
          aria-label="Next page"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className={clsx(
            "group flex size-8 items-center justify-center rounded-lg border border-edge",
            {
              "disabled:cursor-not-allowed disabled:opacity-50":
                currentPage === pageCount,
              "hover:text-border-grey-700 hover:border-edge-heavy":
                currentPage < pageCount,
            },
          )}
        >
          <CaretIcon
            className={clsx("size-4 -rotate-90 text-content-tertiary", {
              "group-hover:text-content-strong group-hover:group-disabled:text-content-tertiary":
                currentPage >= 1,
            })}
          />
        </Button>
      </div>
      {rowsPerPageOptions && handleRowsPerPageChange && (
        <div className="flex w-full justify-end">
          <PaginationSelect
            rowsPerPageOptions={rowsPerPageOptions}
            value={rowsPerPage}
            handleSelect={handleRowsPerPageChange}
          />
        </div>
      )}
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
      placement="top-start"
    >
      <SelectButton
        className={clsx(
          "items-center text-left text-xs",
          "grid h-8 w-20 grid-cols-1fr/auto rounded-lg border border-edge px-2 text-content-strong",
          className,
        )}
      >
        {rowsPerPageOptions[value] ?? value.toString()}
        <CaretIcon className="ml-2 size-4 text-content-tertiary group-hover:text-content-strong" />
      </SelectButton>

      <SelectOptions
        className={clsx(
          "mt-1 mb-2 max-h-24 text-xs focus:ring-0 focus:outline-hidden",
        )}
      >
        {rowsPerPageOptions.map((option, index) => (
          <SelectOption
            key={index}
            value={option}
            className="hover:bg-surface-soft"
          >
            <div className="grid grid-cols-1fr/auto">
              {rowsPerPageOptions[index]}
            </div>
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  );
};
