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
        "3xl:h-12.5",
        "4xl:h-17.5",
        className,
      )}
    >
      <SearchIcon
        className={clsx(
          "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400",
          "3xl:left-4 3xl:size-5",
          "4xl:left-5 4xl:size-7",
        )}
      />
      <input
        type="text"
        placeholder="Search"
        className={clsx(
          "size-full rounded-16 bg-transparent py-2 pr-3 pl-9 text-14 outline-hidden placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500",
          "3xl:pr-4 3xl:pl-11 3xl:text-18",
          "4xl:pr-5 4xl:pl-16 4xl:text-24",
        )}
      />
    </UIModule>
  );
};
