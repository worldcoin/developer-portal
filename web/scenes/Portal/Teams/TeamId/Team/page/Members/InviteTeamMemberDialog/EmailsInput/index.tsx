import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useAtom } from "jotai";

import { FocusEvent, KeyboardEvent, memo, useCallback, useState } from "react";
import { emailsInputAtom } from "..";

export interface EmailsInputProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const SEPARATORS = [",", "Enter", " "];

/**
 * EmailsInput
 * inspired by https://github.com/hc-oss/react-tag-input-component
 */
export const EmailsInput = memo(function EmailsInput(props: EmailsInputProps) {
  const { className, placeholder, disabled } = props;
  const [emails, setEmails] = useAtom(emailsInputAtom);
  const [focused, setFocused] = useState<boolean>(false);

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const text = e.target.value;

      if (text && !emails.includes(text)) {
        setEmails([...emails, text]);
      }

      e.target.value = "";
    },
    [emails, setEmails],
  );

  const handleOnKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      const text = target.value;

      if (!text && emails.length && e.key === "Backspace") {
        target.value = `${emails.at(-1)} `;
        setEmails([...emails.slice(0, -1)]);
      }

      if (text && SEPARATORS.includes(e.key)) {
        e.preventDefault();

        if (emails.includes(text)) {
          return;
        }

        setEmails([...emails, text]);
        target.value = "";
      }
    },
    [emails, setEmails],
  );

  const removeEmail = useCallback(
    (email: string) => setEmails(emails.filter((e) => e !== email)),
    [emails, setEmails],
  );

  return (
    <label
      className={clsx(
        className,
        "flex min-h-12 flex-wrap items-center gap-1 rounded-xl border border-grey-200 bg-grey-0 p-2 text-grey-900 outline-0",
        { "shadow-input": focused },
        { "": !focused },
        { "": emails.length === 0 },
      )}
    >
      {emails.map((email) => (
        <div
          key={email}
          className="flex h-8 items-center gap-x-2 rounded-full bg-blue-50 px-2 text-blue-500"
          onClick={(e) => e.preventDefault()}
        >
          <Typography variant={TYPOGRAPHY.M4}>{email}</Typography>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              removeEmail(email);
            }}
          >
            <CloseIcon strokeWidth={1.5} />
          </Button>
        </div>
      ))}

      <input
        className={clsx(
          "h-8 grow bg-transparent px-2 outline-none",
          "font-gta text-base font-normal leading-[1.5] text-grey-900",
          "placeholder:font-gta placeholder:text-base placeholder:font-normal placeholder:leading-[1.5] placeholder:text-grey-400",
          {
            "w-5": !focused && emails.length === 0,
          },
        )}
        placeholder={emails.length === 0 ? placeholder : undefined}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleOnKeyUp}
      />
    </label>
  );
});

