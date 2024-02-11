import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useAtom } from "jotai";

import { memo, useCallback, useState, KeyboardEvent, FocusEvent } from "react";
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
        "flex flex-wrap items-center gap-1 min-h-12 p-2 text-neutral-primary outline-0 bg-grey-0 border border-grey-200 rounded-xl",
        { "shadow-input": focused },
        { "": !focused },
        { "": emails.length === 0 },
      )}
    >
      {emails.map((email) => (
        <div
          key={email}
          className="flex items-center gap-x-2 h-8 px-2 bg-blue-50 text-blue-500 rounded-full"
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
          "grow h-8 px-2 bg-transparent outline-none",
          "text-grey-900 text-base leading-[1.5] font-normal font-gta",
          "placeholder:text-grey-400 placeholder:text-base placeholder:leading-[1.5] placeholder:font-normal placeholder:font-gta",
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
