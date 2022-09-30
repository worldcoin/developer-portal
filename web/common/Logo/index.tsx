import cn from "classnames";
import { Icon } from "common/Icon";

export const Logo = (props: { className?: string }) => {
  return (
    <div className={cn("grid justify-start gap-y-0.5", props.className)}>
      <Icon name="logo" className="w-32 h-6 text-neutral-dark ml-4.5" />
      <div className="px-1 rounded-md bg-primary/20 justify-self-end">
        <p className="font-sora text-[12px] text-primary">
          {"<"}
          <span className="font-bold">Dev</span>
          {"/Portal>"}
        </p>
      </div>
    </div>
  );
};
