import { Fragment, memo } from "react";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const Connected = memo(function Connected(props: { reset: () => void }) {
  const { reset } = props;

  return (
    <Fragment>
      <div className="grid text-center justify-center px-12 gap-y-8 justify-items-center">
        <div className="grid gap-y-4">
          <Typography variant={TYPOGRAPHY.H6}>Connected!</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-neutral">
            Awaiting confirmation from user
          </Typography>
        </div>

        <DecoratedButton type="button" onClick={reset}>
          <Typography variant={TYPOGRAPHY.M3}>Reset</Typography>
        </DecoratedButton>
      </div>
    </Fragment>
  );
});
