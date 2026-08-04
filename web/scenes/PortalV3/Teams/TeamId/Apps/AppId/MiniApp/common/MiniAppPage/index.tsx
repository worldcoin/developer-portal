import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/**
 * One page shell and one title ramp for every Mini App subtab. Develop set the
 * pattern; Transactions and Notifications each had their own vertical rhythm,
 * content width and title typeface before this.
 */
export const MiniAppPage = (props: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={twMerge("grid gap-y-10 pt-8 pb-12", props.className)}>
    {props.children}
  </div>
);

/**
 * Form-width column. Wider content (the transactions table) skips it. Pass
 * `labelledBy` to make it a named landmark pointing at the page heading.
 */
export const MiniAppPageColumn = (props: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) => {
  const Component = props.labelledBy ? "section" : "div";

  return (
    <Component
      aria-labelledby={props.labelledBy}
      className={twMerge(
        "grid w-full gap-y-8 lg:max-w-[620px]",
        props.className,
      )}
    >
      {props.children}
    </Component>
  );
};

export const MiniAppPageHeader = (props: {
  title: string;
  description?: ReactNode;
  /** Right-aligned slot for a save indicator or action. */
  trailing?: ReactNode;
  id?: string;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="grid gap-y-2">
      <h1
        id={props.id}
        className="font-world text-[26px] leading-[120%] font-semibold tracking-[-0.01em] text-grey-900"
      >
        {props.title}
      </h1>

      {props.description && (
        <p className="font-world text-[15px] leading-[130%] font-medium text-grey-500">
          {props.description}
        </p>
      )}
    </div>

    {props.trailing}
  </div>
);

/** Section heading inside a subtab, one step below the page title. */
export const MiniAppSectionHeading = (props: {
  children: ReactNode;
  className?: string;
}) => (
  <h2
    className={twMerge(
      "font-world text-[17px] leading-[120%] font-medium text-grey-900",
      props.className,
    )}
  >
    {props.children}
  </h2>
);
