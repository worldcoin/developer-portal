import { Icon } from "src/components/Icon";
import { memo } from "react";

export const Preloader = memo(function Preloader(props: {
  className?: string;
}) {
  return (
    <div className={props.className}>
      <Icon name="wld-logo" className="w-full h-full animate-spin" />
    </div>
  );
});
