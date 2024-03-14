import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Fragment, memo } from "react";

export const Connected = memo(function Connected(props: { reset: () => void }) {
  const { reset } = props;

  return (
    <Fragment>
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-y-6 text-center">
        <div className="grid gap-y-4">
          <Typography variant={TYPOGRAPHY.H6}>Connected!</Typography>
          <Typography variant={TYPOGRAPHY.R3}>
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

