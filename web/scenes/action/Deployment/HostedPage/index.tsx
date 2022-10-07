import { FieldInput } from "common/FieldInput";
import { useValues } from "kea";
import { actionLogic } from "logics/actionLogic";
import cn from "classnames";
import { Field as ActionField } from "scenes/action/ActionHeader/Field";
import { Field } from "kea-forms";

export function HostedPage(props: { actionId: string }) {
  const { actionUrls } = useValues(actionLogic);

  return (
    <div className="grid gap-y-6">
      <div>
        <div className="font-medium text-14 leading-4">Hosted page URL</div>
        <ActionField
          className="mt-2 text-14 leading-4"
          value={actionUrls?.hostedPage ?? ""}
          copyable
        />
      </div>

      <div className="grid gap-y-2">
        <div className="grid grid-cols-1fr/auto">
          <label
            className="grid grid-flow-row gap-y-1 text-14 leading-4"
            htmlFor={`${HostedPage.name}-returnUrl`}
          >
            <span
              className={cn(
                "inline-grid grid-flow-col gap-x-0.5 justify-start font-semibold",
                "after:inline-block after:w-1.5 after:h-1.5 after:rounded-full after:bg-ff6848"
              )}
            >
              Return URL
            </span>
            <span className="font-normal text-neutral">
              This is where we’ll redirect the user after verification.
            </span>
          </label>
        </div>
        {
          <Field noStyle name="return_url">
            {({ value, onChange, error }) => (
              <FieldInput
                id={`${HostedPage.name}-returnUrl`}
                className="!h-[44px] !px-4"
                variant="small"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                name="return_url"
                error={error}
                type="text"
              />
            )}
          </Field>
        }
      </div>
    </div>
  );
}
