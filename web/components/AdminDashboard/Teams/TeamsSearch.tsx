"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type TeamsSearchProps = {
  value: string;
};

export const TeamsSearch = ({ value }: TeamsSearchProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = searchValue.trim();

      if (nextValue === value) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (nextValue) {
        params.set("query", nextValue);
      } else {
        params.delete("query");
      }

      params.delete("page");

      const query = params.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router, searchParams, searchValue, value]);

  return (
    <div className="relative h-9 w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grey-400" />
      <input
        aria-label="Search teams"
        className="size-full rounded-12 border border-grey-200 bg-grey-0 py-0 pl-9 pr-3 text-14 font-medium text-grey-700 outline-none transition-colors placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500"
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search teams"
        type="search"
        value={searchValue}
      />
    </div>
  );
};
