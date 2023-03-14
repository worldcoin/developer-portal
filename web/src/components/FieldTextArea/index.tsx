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

interface FieldTextAreaInterface
  extends InputHTMLAttributes<HTMLTextAreaElement> {}

export const FieldTextArea = memo(
  forwardRef<HTMLTextAreaElement, FieldTextAreaInterface>(function FieldInput(
    props,
    ref
  ) {
    const { className, value, onChange, ...otherProps } = props;

    const [isEmpty, setIsEmpty] = useState<boolean>(true);

    // This useEffect is required to set the correct state of the input field when the value is changed from outside
    useEffect(() => {
      if (value == null || value === "") {
        setIsEmpty(true);
      }
    }, [value]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        setIsEmpty(e.target.value === "");
        if (onChange) {
          onChange(e);
        }
      },
      [onChange]
    );

    return (
      <textarea
        ref={ref}
        className={cn(
          className,
          "flex items-center h-12 p-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input min-h-[128px]",
          {
            "placeholder-neutral-secondary bg-f3f4f5 border-f1f5f8 focus:bg-ffffff focus:border-ebecef":
              isEmpty,
          },
          { "bg-ffffff border-d6d9dd": !isEmpty }
        )}
        value={value}
        onChange={handleChange}
        {...otherProps}
      />
    );
  })
);
