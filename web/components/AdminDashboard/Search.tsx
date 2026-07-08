import { clsx } from "clsx";
import { Search as SearchIcon } from "lucide-react";
import { UIModule } from "./UIModule";

type SearchProps = {
  className?: string;
};

export const Search = ({ className }: SearchProps) => {
  return (
    <UIModule className={clsx("relative h-10 p-0", className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grey-400" />
      <input
        type="text"
        placeholder="Search"
        className="size-full rounded-16 bg-transparent py-2 pl-9 pr-3 text-14 outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500"
      />
    </UIModule>
  );
};
