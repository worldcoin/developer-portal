import { Icon } from "common/Icon";
import { Link } from "common/Link";
import { Button } from "common/Button";
import { memo, useEffect, useState } from "react";
import cn from "classnames";
import { Preview } from "common/Preview";
import { useActions, useValues } from "kea";
import { FieldInput } from "common/FieldInput";
import { urls } from "urls";
import { actionLogic } from "logics/actionLogic";

export const Display = memo(function Display() {
  const { currentAction, currentActionLoading } = useValues(actionLogic);
  const { updateAction } = useActions(actionLogic);
  const [publicDescription, setPublicDescription] = useState("");

  useEffect(
    () => setPublicDescription(currentAction?.public_description ?? ""),
    [currentAction?.public_description]
  );

  return (
    <div className="grid items-start lg:grid-cols-1fr/auto gap-x-32 gap-y-12">
      <div className="grid gap-y-10">
        <p>
          Configure how users will see verification for this action in the
          Worldcoin app.
        </p>

        <div>
          <p className="font-medium">Public description</p>

          <FieldInput
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
            disabled={currentActionLoading}
          />
        </div>

        <div>
          <p className="font-medium">App name &amp; logo</p>

          <Link
            className={cn(
              "grid grid-flow-col auto-cols-max items-center mt-4.5"
            )}
            href={urls.team()}
          >
            Go to My Team settings
            <Icon className="w-5 h-5 -rotate-90" name="angle-down" />
          </Link>
        </div>

        <Button
          id="saveActionDisplaySettings"
          className="justify-self-start lg:justify-self-end mt-4"
          color="primary"
          variant="contained"
          fullWidth
          maxWidth="xs"
          loading={currentActionLoading}
          onClick={() =>
            updateAction({
              attr: "public_description",
              value: publicDescription,
            })
          }
        >
          Save changes
        </Button>
      </div>

      {currentAction?.app && (
        <Preview
          className="justify-self-center"
          app={currentAction.app}
          message={publicDescription}
        />
      )}
    </div>
  );
});
