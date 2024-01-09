import {
  ChangeEvent,
  forwardRef,
  SelectHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import cn from "classnames";

interface FieldSelectInterface extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: { value: string; label: string }[];
}

export const FieldSelect = memo(
  forwardRef<HTMLSelectElement, FieldSelectInterface>(function FieldSelect(
    props: FieldSelectInterface,
    ref
  ) {
    const { className, value, onChange, invalid, options, ...otherProps } =
      props;

    const [isEmpty, setIsEmpty] = useState<boolean>(!value);

    // This useEffect is required to set the correct state of the select field when the value is changed from outside
    useEffect(() => {
      setIsEmpty(!value);
    }, [value]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        setIsEmpty(e.target.value === "");
        if (onChange) {
          onChange(e);
        }
      },
      [onChange]
    );

    return (
      <select
        ref={ref}
        className={cn(
          className,
          "flex items-center h-10 mt-2 px-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input",
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
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  })
);
