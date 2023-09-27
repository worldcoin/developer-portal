import { memo, useState } from "react";
import { Button } from "src/components/Button";
import useSignInAction from "src/hooks/useSignInAction";
import { RedirectInput } from "./RedirectInput";

export const Redirects = memo(function Redirects() {
  const {
    redirects,
    redirectsIsLoading,
    addRedirect,
    updateRedirect,
    deleteRedirect,
  } = useSignInAction();

  const [addRedirectFormShown, setAddRedirectFormShown] = useState(false);

  if (redirectsIsLoading) {
    return null;
  }

  return (
    <section className="grid gap-y-4">
      <div className="grid gap-y-2">
        <h4 className="font-medium">Redirects</h4>
        <p className="text-14 text-neutral-secondary leading-none">
          You must specify at least one URL for authentication to work.
        </p>
      </div>

      <div className="grid gap-y-2">
        {redirects?.map((redirect) => (
          <RedirectInput
            key={`signin-redirect-input-${redirect.id}`}
            value={redirect.redirect_uri}
            onChange={(value) => {
              if (value !== redirect.redirect_uri) {
                updateRedirect({ id: redirect.id, uri: value });
              }
            }}
            onDelete={() => deleteRedirect({ id: redirect.id })}
          />
        ))}
        {addRedirectFormShown && (
          <RedirectInput
            value=""
            onChange={(value) => {
              setAddRedirectFormShown(false);
              addRedirect({ uri: value });
            }}
            onDelete={() => setAddRedirectFormShown(false)}
          />
        )}
      </div>

      <div className="grid grid-flow-col justify-start gap-x-2">
        <Button
          onClick={() => setAddRedirectFormShown(true)}
          className="px-4 py-2"
          variant="secondary"
        >
          Add another
        </Button>
      </div>
    </section>
  );
});
