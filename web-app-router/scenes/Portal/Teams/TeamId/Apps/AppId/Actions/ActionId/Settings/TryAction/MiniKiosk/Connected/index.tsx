import { Fragment, memo } from "react";
import clsx from "clsx";
import { DecoratedButton } from "@/components/DecoratedButton";

export const Connected = memo(function Connected(props: { reset: () => void }) {
  const { reset } = props;

  return (
    <Fragment>
      <div className="grid text-center justify-center px-12 gap-y-8 justify-items-center">
        <div className="grid gap-y-4">
          <p className="text-2xl font-semibold">Connected!</p>
          <p className="text-neutral">Awaiting confirmation from user</p>
        </div>

        <DecoratedButton type="button" className={clsx("")} onClick={reset}>
          Reset
        </DecoratedButton>
      </div>
    </Fragment>
  );
});
