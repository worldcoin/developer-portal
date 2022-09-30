import cn from "classnames";
import { memo } from "react";
import { Link as LinkBase, LinkInterface } from "common/components/Link";

export const Link = memo(function Link(props: LinkInterface) {
  const { className, ...other } = props;
  return (
    <LinkBase
      className={cn(
        "text-primary hover:opacity-70 transition-opacity",
        className
      )}
      {...other}
    />
  );
});
