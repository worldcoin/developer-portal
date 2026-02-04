"use client";

import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "../Button";
import { CopyCheckIcon } from "../Icons/CopyCheckIcon";
import { CopyIcon } from "../Icons/CopyIcon";

export const CopyButton = (props: {
  fieldName: string;
  fieldValue: string;
  className?: string;
  disabled?: boolean;
}) => {
  const { fieldName, fieldValue, className, disabled } = props;
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (event: any) => {
    setIsCopied(true);
    event.stopPropagation();
    navigator.clipboard.writeText(fieldValue);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => {
      setIsCopied(false);
    }, 4000);
  };

  return (
    <Button
      type="button"
      onClick={copyToClipboard}
      className={clsx("pr-4", className)}
      disabled={disabled}
    >
      {isCopied ? (
        <CopyCheckIcon className={clsx("size-5 text-grey-900")} />
      ) : (
        <CopyIcon className="size-5 text-grey-900" />
      )}
    </Button>
  );
};
