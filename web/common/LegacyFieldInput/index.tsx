// FIXME: deprecated, remove after refactoring
import cn from "classnames";
import { createContext, InputHTMLAttributes, memo, ReactNode } from "react";

// The context is required to get the state of the field inside the addon and not pass it from outside
export const FieldInputContext = createContext({} as FieldInputInterface);

export interface FieldInputInterface
  extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerClassName?: string;
  variant?: "small" | "large";
  addon?: ReactNode;
  error?: ReactNode;
}

export const FieldInput = memo(function FieldInput(props: FieldInputInterface) {
  const {
    className,
    variant = "large",
    addon,
    error,
    containerClassName,
    ...otherProps
  } = props;

  return (
    <FieldInputContext.Provider value={props}>
      <div>
        <span
          className={cn("relative grid grid-cols-1fr/auto", containerClassName)}
        >
          <input
            className={cn(
              className,
              "w-full font-rubik leading-4 border",
              { "h-14 px-5 text-16 rounded-xl": variant === "large" },
              { "h-[50px] px-3 text-14 rounded-lg": variant === "small" },
              { "text-neutral bg-fbfbfb": props.readOnly || props.disabled },
              { "border-neutral-muted": !error },
              { "border-warning": error },
              { "pr-12": addon }
            )}
            {...otherProps}
          />
          {addon}
        </span>

        <span className="text-warning text-12">{error}</span>
      </div>
    </FieldInputContext.Provider>
  );
});
