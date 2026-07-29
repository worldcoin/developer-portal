import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
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
        "flex min-h-11 flex-wrap items-center gap-1 rounded-8 border bg-white p-1.5 text-portal-text outline-hidden transition",
        focused ? "border-grey-400 ring-2 ring-grey-200" : "border-grey-200",
        disabled && "bg-grey-50 text-grey-400",
      )}
    >
      {emails.map((email) => (
        <div
          key={email}
          className="flex h-7 items-center gap-x-1.5 rounded-full bg-blue-50 px-2 font-world text-13 text-blue-500"
          onClick={(e) => e.preventDefault()}
        >
          <span>{email}</span>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              removeEmail(email);
            }}
            className="size-5"
          >
            <CloseIcon className="size-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      ))}

      <input
        className={clsx(
          "h-8 min-w-24 grow bg-transparent px-1.5 font-world text-14 text-portal-text outline-hidden",
          "placeholder:font-world placeholder:text-14 placeholder:text-grey-400",
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
