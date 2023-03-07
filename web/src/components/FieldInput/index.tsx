import {
  ChangeEvent,
  forwardRef,
  InputHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import cn from "classnames";

interface FieldInputInterface extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const FieldInput = memo(
  forwardRef<HTMLInputElement, FieldInputInterface>(function FieldInput(
    props: FieldInputInterface,
    ref
  ) {
    const { className, value, onChange, invalid, ...otherProps } = props;

    const [isEmpty, setIsEmpty] = useState<boolean>(true);

    // This useEffect is required to set the correct state of the input field when the value is changed from outside
    useEffect(() => {
      if (value == null || value === "") {
        setIsEmpty(true);
      }
    }, [value]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setIsEmpty(e.target.value === "");
        if (onChange) {
          onChange(e);
        }
      },
      [onChange]
    );

    return (
      <input
        ref={ref}
        className={cn(
          className,
          "flex items-center h-12 px-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input focus:bg-ffffff",
          {
            "placeholder-neutral-secondary bg-f3f4f5 border-f1f5f8 focus:bg-ffffff focus:border-ebecef":
              isEmpty && !invalid,
          },
          { "bg-ffffff border-d6d9dd": !isEmpty && !invalid },
          { "bg-fff0ed border-ff6848 focus:border-ff6848": invalid }
        )}
        value={value}
        onChange={handleChange}
        aria-invalid={invalid ? "true" : "false"}
        {...otherProps}
      />
    );
  })
);
