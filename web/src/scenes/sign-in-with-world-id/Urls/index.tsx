import { memo } from "react";
import useSignInAction from "@/hooks/useSignInAction";
import { UrlInput } from "@/scenes/sign-in-with-world-id/Urls/UrlInput";

export const Urls = memo(function Urls() {
  const { action, updateAction } = useSignInAction();

  if (!action) {
    return null;
  }

  return (
    <>
      <div className="grid gap-y-4">
        <div className="grid gap-y-2">
          <h4 className="font-medium">Terms</h4>
          <p className="text-14 text-neutral-secondary leading-none">
            Link to the webpage where your terms is posted.
          </p>
        </div>

        <UrlInput
          value={action.terms_uri}
          onChange={(terms_uri) => {
            if (terms_uri !== action.terms_uri) {
              updateAction({ changes: { terms_uri } });
            }
          }}
        />
      </div>

      <div className="grid gap-y-4">
        <div className="grid gap-y-2">
          <h4 className="font-medium">Privacy policy</h4>
          <p className="text-14 text-neutral-secondary leading-none">
            Link to the webpage where your privacy policy is posted.
          </p>
        </div>

        <UrlInput
          value={action.privacy_policy_uri}
          onChange={(privacy_policy_uri) => {
            if (privacy_policy_uri !== action.privacy_policy_uri) {
              updateAction({ changes: { privacy_policy_uri } });
            }
          }}
        />
      </div>
    </>
  );
});
