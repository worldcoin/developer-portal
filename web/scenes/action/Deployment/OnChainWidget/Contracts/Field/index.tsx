import { FieldInput, FieldInputInterface } from "common/FieldInput";
import { FieldInputAddon } from "common/FieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { Icon } from "common/Icon";
import { Link } from "common/components/Link";
import { memo, useCallback, useEffect, useState } from "react";
import cn from "classnames";
import { FieldError } from "common/FieldError";

interface FieldInterface extends FieldInputInterface {
  title: string;
  description?: string;
  linkText?: string;
  url?: string;
}

export const Field = memo(function Field(props: FieldInterface) {
  const { title, description, linkText, url, ...restProps } = props;
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const copyToClipBoard = useCallback(() => {
    if (props.disabled || !props.value || !props.defaultValue) {
      return;
    }

    navigator.clipboard
      .writeText((props.value || props.defaultValue) as string)
      .then(() => setIsCopied(true));
  }, [props.defaultValue, props.disabled, props.value]);

  return (
    <label className="grid xl:grid-cols-[20%_1fr_20%] xl:items-center gap-y-2">
      <div className="grid items-center gap-x-2 gap-y-1.5 leading-none justify-self-start">
        <Icon name="document" className="w-4 h-4 col-start-1" />

        <span className="col-start-2">{title}</span>
        {description && (
          <span className="col-start-2 text-14 text-neutral">
            {description}
          </span>
        )}
      </div>

      <div className="min-w-[388px] xl:justify-self-center">
        <FieldInput
          className={cn("w-full", { "select-none": props.disabled })}
          addon={
            <FieldInputAddon>
              <FieldInputAddonAction
                className={cn({
                  "opacity-30 pointer-events-none": props.disabled,
                })}
                onClick={copyToClipBoard}
              >
                {isCopied ? (
                  <Icon name="check" className="w-6 h-6 text-success" />
                ) : (
                  <Icon name="copy" className="w-6 h-6" />
                )}
              </FieldInputAddonAction>
            </FieldInputAddon>
          }
          {...restProps}
        />
        {props.error && (
          <FieldError className="mb-2.5">{props.error}</FieldError>
        )}
      </div>

      {url && linkText && (
        <Link
          href={url}
          className="grid items-center justify-start grid-flow-col xl:justify-end"
          external
        >
          <span className="text-primary">{linkText}</span>
          <Icon name="angle-down" className="w-6 h-6 -rotate-90 text-primary" />
        </Link>
      )}
    </label>
  );
});
