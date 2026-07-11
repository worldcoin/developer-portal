import { clsx } from "clsx";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { UIModule } from "./UIModule";

type SearchProps = {
  className?: string;
};

export const Search = ({ className }: SearchProps) => {
  return (
    <UIModule
      className={clsx(
        "relative h-10 p-0",
        "3xl:h-[3.125rem]",
        "4xl:h-[4.375rem]",
        className,
      )}
    >
      <SearchIcon
        className={clsx(
          "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grey-400",
          "3xl:left-4 3xl:size-5",
          "4xl:left-5 4xl:size-7",
        )}
      />
      <input
        type="text"
        placeholder="Search"
        className={clsx(
          "size-full rounded-16 bg-transparent py-2 pl-9 pr-3 text-14 outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500",
          "3xl:pl-11 3xl:pr-4 3xl:text-18",
          "4xl:pl-16 4xl:pr-5 4xl:text-24",
        )}
      />
    </UIModule>
  );
};
