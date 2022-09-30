import { Icon } from "common/Icon";
import { Fragment, memo } from "react";

interface HostedErrorInterface {
  error?: string;
}

export const HostedError = memo(function HostedError({
  error = "It looks like some parameters are missing from this request. Please check your link and try again.",
}: HostedErrorInterface): JSX.Element {
  return (
    <Fragment>
      <div className="grid justify-center">
        <Icon
          name="illustration-error"
          noMask
          className="block w-[100px] h-[100px]"
        />
      </div>
      <p className="text-16 text-warning text-center leading-5">{error}</p>
    </Fragment>
  );
});
