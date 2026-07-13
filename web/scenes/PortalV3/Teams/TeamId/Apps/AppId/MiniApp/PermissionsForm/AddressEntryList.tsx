"use client";

import { CopyButton } from "@/components/CopyButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useState } from "react";

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

type AddressEntryListProps = {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  disabled: boolean;
  emptyText: string;
  allowCommaSeparated?: boolean;
};

export const AddressEntryList = (props: AddressEntryListProps) => {
  const {
    values,
    onChange,
    placeholder,
    disabled,
    emptyText,
    allowCommaSeparated = false,
  } = props;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const addresses = (allowCommaSeparated ? draft.split(",") : [draft])
      .map((address) => address.trim())
      .filter(Boolean);
    if (addresses.length === 0) return;

    if (addresses.some((address) => !ETH_ADDRESS_REGEX.test(address))) {
      setError(
        allowCommaSeparated
          ? "Enter valid Worldchain addresses separated by commas (each must be 0x followed by 40 hex characters)."
          : "Enter a valid Worldchain address (0x followed by 40 hex characters).",
      );
      return;
    }

    const seenAddresses = new Set(values.map((value) => value.toLowerCase()));
    const hasDuplicate = addresses.some((address) => {
      const normalizedAddress = address.toLowerCase();

      if (seenAddresses.has(normalizedAddress)) {
        return true;
      }

      seenAddresses.add(normalizedAddress);
      return false;
    });

    if (hasDuplicate) {
      setError(
        addresses.length > 1
          ? "Remove duplicate or previously added addresses before adding."
          : "This address has already been added.",
      );
      return;
    }

    onChange([...values, ...addresses]);
    setDraft("");
    setError(null);
  };

  return (
    <div className="grid gap-y-3">
      {!disabled && (
        <div className="grid gap-y-1.5">
          <div
            className={clsx(
              "flex h-12 items-center gap-x-3 rounded-xl border bg-grey-0 px-4 transition-colors",
              error
                ? "border-system-error-500"
                : "border-grey-200 focus-within:border-blue-500",
            )}
          >
            <MagnifierIcon className="size-5 shrink-0 text-grey-400" />

            <input
              type="text"
              value={draft}
              placeholder={placeholder}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent font-world text-[15px] text-grey-900 placeholder:text-grey-400 focus:outline-none focus:ring-0"
            />

            <button
              type="button"
              onClick={add}
              disabled={!draft.trim()}
              className="font-world text-[13px] font-semibold text-blue-500 disabled:text-grey-300"
            >
              Add
            </button>
          </div>

          {error && (
            <p className="px-2 font-world text-xs text-system-error-500">
              {error}
            </p>
          )}
        </div>
      )}

      {values.length === 0 ? (
        <Typography variant={TYPOGRAPHY.R4} className="px-1 text-grey-400">
          {emptyText}
        </Typography>
      ) : (
        <div className="grid gap-y-2">
          {values.map((address) => (
            <div
              key={address}
              className="flex h-[52px] items-center gap-x-3 rounded-xl border border-grey-100 pl-4 pr-2"
            >
              <span
                className="min-w-0 flex-1 truncate font-world text-[15px] text-grey-900"
                title={address}
              >
                {truncateAddress(address)}
              </span>

              <CopyButton
                fieldName="Address"
                fieldValue={address}
                className="rounded-lg p-2 !pr-2 hover:bg-grey-100"
                iconClassName="size-4 text-grey-500"
              />

              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(values.filter((v) => v !== address))}
                  aria-label={`Remove ${address}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100 hover:text-grey-900"
                >
                  <CloseIcon className="size-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
