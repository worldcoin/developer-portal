import { Icon } from "common/Icon";
import { Fragment, memo, ReactNode } from "react";

export const Instructions = memo(function Instructions(props: {
  items: Array<{ step: string; children: ReactNode }>;
}) {
  return (
    <div className="grid grid-cols-auto/1fr gap-x-5 gap-y-2.5">
      {props.items.map((item, index) => (
        <Fragment key={`instructions-element-${index}`}>
          <Icon
            name="checkmark-selected"
            className="w-6 h-6 text-primary col-start-1"
          />
          <div className="col-start-2 grid grid-cols-auto/1fr gap-x-2 font-semibold">
            <span>{index + 1}.</span>
            <span>{item.step}</span>
          </div>

          {index !== props.items.length - 1 && (
            <div className="flex justify-center">
              <hr className="border-l border-primary w-px h-full" />
            </div>
          )}

          <div className="col-start-2">{item.children}</div>
        </Fragment>
      ))}
    </div>
  );
});
