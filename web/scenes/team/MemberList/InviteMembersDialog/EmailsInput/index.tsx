import {
  memo,
  useCallback,
  useState,
  KeyboardEvent,
  FocusEvent,
  useEffect,
} from "react";
import cn from "classnames";

export interface EmailsInputProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
}

const SEPARATORS = [",", "Enter"];

/**
 * EmailsInput
 * inspired by https://github.com/hc-oss/react-tag-input-component
 */
export const EmailsInput = memo(function EmailsInput(props: EmailsInputProps) {
  const { className, placeholder, disabled, value, onChange } = props;
  const [emails, setEmails] = useState<string[]>(value || []);
  const [focused, setFocused] = useState<boolean>(false);

  useEffect(() => {
    setEmails((emails) => {
      if (JSON.stringify(value) !== JSON.stringify(emails)) {
        return value;
      }
      return emails;
    });
  }, [value]);

  useEffect(() => {
    onChange(emails);
  }, [emails, onChange]);

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
    [emails]
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
    [emails]
  );

  return (
    <label
      className={cn(
        className,
        "flex flex-wrap items-center gap-1 min-h-12 p-2 text-neutral-primary outline-0 bg-ffffff border-2 border-d6d9dd rounded-xl",
        { "shadow-input": focused },
        { "": !focused },
        { "": emails.length === 0 }
      )}
    >
      {emails.map((email) => (
        <div
          key={email}
          className="flex items-center h-8 px-2 bg-f3f4f5 rounded-lg"
        >
          {email}
        </div>
      ))}
      <input
        className={cn(
          "grow h-8 px-2 bg-transparent outline-none placeholder-neutral-secondary",
          {
            "w-5": !focused && emails.length === 0,
          }
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
