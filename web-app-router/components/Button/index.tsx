import { ComponentProps, memo } from "react";
import { CommonLinkProps, Link } from "@/components/Link";

export type CommonButtonProps =
  | (ComponentProps<"button"> & {
      type: ComponentProps<"button">["type"];
      href?: never;
      disabled?: boolean;
    })
  | (CommonLinkProps & {
      type?: never;
      href: string;
      disabled?: boolean;
    });

export const Button = memo(function Button(props: CommonButtonProps) {
  if (props.href) {
    return <Link {...props} />;
  }

  if (props.type) {
    const { disabled, ...buttonProps } = props;

    return <button {...buttonProps} type={props.type} disabled={disabled} />;
  }

  return null;
});
