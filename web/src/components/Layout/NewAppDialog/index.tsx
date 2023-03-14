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

type FormData = Pick<
  AppModel,
  "name" | "description_internal" | "engine" // | "logo_url"
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
      },
    });

  const onSubmit = handleSubmit(async (data) => {
    await createNewApp(data);
    props.onClose();
    reset();
  });

  return (
    <Dialog open={props.open} onClose={props.onClose}>
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
              placeholder="Add your app name (visible to users)"
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
              placeholder="Add something helpful that will help you and your teammates identify your app. This is only visible to your team."
              type="text"
              {...register("description_internal")}
              readOnly={formState.isSubmitting}
            />
          </div>

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
