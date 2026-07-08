import { clsx } from "clsx";
import { UIModule } from "./UIModule";

type SearchProps = {
  className?: string;
};

export const Search = ({ className }: SearchProps) => {
  return (
    <UIModule className={clsx("p-0", className)}>
      <input
        type="text"
        placeholder="Search"
        className="w-full rounded-16 bg-transparent p-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
    </UIModule>
  );
};
