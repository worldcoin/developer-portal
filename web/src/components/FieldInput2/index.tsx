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
  label?: string;
  invalid?: boolean;
}

export const FieldInput = memo(
  forwardRef<HTMLInputElement, FieldInputInterface>(function FieldInput(
    props: FieldInputInterface,
    ref
  ) {
    const { className, value, onChange, label, invalid, ...otherProps } = props;

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
      <div className="relative">
        {label && (
          <span className="absolute -top-2 left-3 px-1 leading-4 text-12 text-gray-400 bg-white rounded">
            {label}
          </span>
        )}

        <input
          ref={ref}
          className={cn(
            className,
            "border-gray-200",
            "flex items-center w-full h-12 px-4 text-neutral-primary outline-0 border rounded-xl focus:shadow-input focus:bg-ffffff",
            { "border-ff6848 focus:border-ff6848": invalid }
          )}
          value={value}
          onChange={handleChange}
          aria-invalid={invalid ? "true" : "false"}
          {...otherProps}
        />
      </div>
    );
  })
);
