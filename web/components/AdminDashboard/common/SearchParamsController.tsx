"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchParamsPatch = Record<string, string | null | undefined>;
type SearchParamsUpdater = (patch: SearchParamsPatch) => void;

const SearchParamsUpdaterContext = createContext<SearchParamsUpdater | null>(
  null,
);

const useSearchParamsUpdater = (): SearchParamsUpdater => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsRef = useRef(new URLSearchParams(searchParams.toString()));
  const navigationQueuedRef = useRef(false);

  useEffect(() => {
    if (!navigationQueuedRef.current) {
      paramsRef.current = new URLSearchParams(searchParams.toString());
    }
  }, [searchParams]);

  return useCallback(
    (patch) => {
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") {
          paramsRef.current.delete(key);
        } else {
          paramsRef.current.set(key, value);
        }
      }

      if (navigationQueuedRef.current) {
        return;
      }

      navigationQueuedRef.current = true;
      queueMicrotask(() => {
        navigationQueuedRef.current = false;
        const query = paramsRef.current.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router],
  );
};

export const AdminSearchParamsController = ({
  children,
}: {
  children: ReactNode;
}) => {
  const updateSearchParams = useSearchParamsUpdater();

  return (
    <SearchParamsUpdaterContext.Provider value={updateSearchParams}>
      {children}
    </SearchParamsUpdaterContext.Provider>
  );
};

export const useAdminSearchParamsPatch = () => {
  const contextUpdater = useContext(SearchParamsUpdaterContext);
  const fallbackUpdater = useSearchParamsUpdater();

  return contextUpdater ?? fallbackUpdater;
};
