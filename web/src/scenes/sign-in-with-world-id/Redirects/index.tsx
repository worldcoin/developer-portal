import { Button } from "src/components/Button";
import { FieldInput } from "src/components/FieldInput";
import { Icon } from "src/components/Icon";
import { memo, useCallback, useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useSignInActionStore } from "../store";

export const Redirects = memo(function Redirects() {
  const {
    redirectInputs,
    updateRedirectInputs,
    saveRedirects,
    removeRedirect,
  } = useSignInActionStore((state) => ({ ...state }), shallow);

  return (
    <section className="grid gap-y-4">
      <div className="grid gap-y-2">
        <h4 className="font-medium">Redirects</h4>
        <p className="text-14 text-neutral-secondary leading-none">
          You must specify at least one URL for authentication to work.
        </p>
      </div>

      <div className="grid gap-y-2">
        {redirectInputs.map((_, index) => (
          <div
            className="grid grid-cols-1fr/auto gap-x-2 items-center"
            key={`signin-redirect-input-${index}`}
          >
            <FieldInput
              className="w-full"
              value={redirectInputs[index]}
              onChange={(e) => updateRedirectInputs(index, e.target.value)}
            />

            <button
              type="button"
              onClick={() => removeRedirect(index)}
              className="text-0 group"
            >
              <Icon
                name="close"
                className="w-6 h-6 bg-neutral-secondary group-hover:bg-neutral-dark transition-colors"
              />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-flow-col justify-start gap-x-2">
        <Button
          onClick={() => updateRedirectInputs(redirectInputs.length, "")}
          className="px-4 py-2"
          variant="secondary"
        >
          Add another
        </Button>

        <Button
          onClick={saveRedirects}
          className="px-4 py-2"
          variant="secondary"
        >
          Save
        </Button>
      </div>
    </section>
  );
});
