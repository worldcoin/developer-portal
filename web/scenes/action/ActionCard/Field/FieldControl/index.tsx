import { Icon, IconType } from "common/Icon";
import { memo, MouseEventHandler } from "react";
import cn from "classnames";

interface FieldControlPropsBase {
  icon: IconType;
  type?: "button" | "link";
  href?: string;
  target?: string;
  className?: string;
  onClick?:
    | MouseEventHandler<HTMLButtonElement>
    | MouseEventHandler<HTMLAnchorElement>;
}

interface FieldControlPropsButton extends FieldControlPropsBase {
  type?: "button";
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface FieldControlPropsLink extends FieldControlPropsBase {
  type: "link";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  href: string;
}

type FieldControlProps = FieldControlPropsButton | FieldControlPropsLink;

export const FieldControl = memo(function FieldControl(
  props: FieldControlProps
) {
  const className = cn(
    "transition-opacity text-0 hover:opacity-70",
    props.className
  );

  if (props.type === "link") {
    return (
      <a
        className={className}
        href={props.href}
        target={props.target}
        onClick={props.onClick}
      >
        <Icon name={props.icon} className="w-6 h-6 ml-1" />
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={props.onClick}>
      <Icon name={props.icon} className="w-6 h-6 ml-1" />
    </button>
  );
});
