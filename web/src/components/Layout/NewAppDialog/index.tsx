import { memo } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { EngineSwitch } from "./EngineSwitch";
import { useForm, Controller } from "react-hook-form";
import { EngineType } from "src/lib/types";
import { Illustration } from "src/components/Auth/Illustration";
import { AppModel } from "src/lib/models";
import useApps from "src/hooks/useApps";
import { FieldTextArea } from "src/components/FieldTextArea";
import { Switch } from "src/components/Switch";
import cn from "classnames";

type FormData = Pick<
  AppModel,
  "name" | "description_internal" | "engine" | "is_staging" // | "logo_url"
>;

export interface NewAppDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NewAppDialog = memo(function NewAppDialog(
  props: NewAppDialogProps
) {
  const { createNewApp } = useApps();
  const { control, register, reset, handleSubmit, formState } =
    useForm<FormData>({
      defaultValues: {
        engine: EngineType.Cloud,
        is_staging: true,
      },
    });

  const onSubmit = handleSubmit(async (data) => {
    await createNewApp(data);
    props.onClose();
    reset();
  });

  return (
    <Dialog
      panelClassName="max-h-full overflow-y-auto lg:min-w-[712px]"
      open={props.open}
      onClose={props.onClose}
    >
      <form onSubmit={onSubmit}>
        <DialogHeader
          title="Create New App"
          icon={
            <Illustration icon="apps" />
            // TODO: implement upload @see https://ottofeller.slack.com/archives/C03MN2BP61J/p1678706912991919?thread_ts=1678692982.933069&cid=C03MN2BP61J
            // <Controller
            //   name="imageUrl"
            //   control={control}
            //   render={({ field }) => (
            //     <ImageInput
            //       icon="apps"
            //       imageUrl={field.value}
            //       onImageUrlChange={field.onChange}
            //       disabled={formState.isSubmitting}
            //     />
            //   )}
            // />
          }
        />

        <div>
          <div className="flex flex-col gap-y-2">
            <FieldLabel className="font-rubik" required>
              Name
            </FieldLabel>

            <FieldInput
              className="w-full font-rubik"
              placeholder="Visible to users"
              type="text"
              {...register("name", { required: true })}
              readOnly={formState.isSubmitting}
              invalid={!!formState.errors.name}
            />
          </div>

          <div className="mt-6 flex flex-col gap-y-2">
            <FieldLabel className="font-rubik">Description</FieldLabel>
            <FieldTextArea
              className="w-full font-rubik"
              placeholder="For internal reference. Visible only to you and your team."
              type="text"
              {...register("description_internal")}
              readOnly={formState.isSubmitting}
            />
          </div>

          <Controller
            name="is_staging"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 relative bg-f3f4f5 border border-f1f5f8 rounded-xl h-12 mt-6">
                <div
                  className={cn(
                    "absolute inset-y-0.5 w-1/2 bg-neutral-dark border-f1f5f8 rounded-[10px] transition-[left]",
                    { "left-0.5": field.value === true },
                    { "left-[calc(50%_-_2px)]": field.value === false }
                  )}
                />

                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "z-10 transition-colors text-14 font-rubik outline-none",
                    { "text-ffffff": field.value === true },
                    { "text-neutral-dark": field.value === false }
                  )}
                >
                  Staging
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "z-10 transition-colors text-14 font-rubik outline-none",
                    { "text-neutral-dark": field.value === true },
                    { "text-ffffff": field.value === false }
                  )}
                >
                  Production
                </button>
              </div>
            )}
          />

          <Controller
            name="engine"
            control={control}
            render={({ field }) => (
              <EngineSwitch
                value={field.value}
                onChange={field.onChange}
                disabled={formState.isSubmitting}
              />
            )}
          />

          <Button
            className="w-full h-[56px] mt-12 font-medium"
            type="submit"
            disabled={formState.isSubmitting}
          >
            Create New App
          </Button>
        </div>
      </form>
    </Dialog>
  );
});
