"use client";

import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import type { ChangeEventHandler } from "react";

export const ActionsSearch = (props: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) => {
  return (
    <Input
      value={props.value}
      onChange={props.onChange}
      label=""
      aria-label="Search actions"
      placeholder="Search actions"
      className="h-10 w-full py-0 text-sm"
      addOnLeft={
        <SearchIcon
          className={clsx("mx-2 text-grey-400", opticalIconClassName)}
          aria-hidden="true"
        />
      }
    />
  );
};
