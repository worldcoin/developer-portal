import { memo, useCallback, useMemo, useState } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { EngineSwitch } from "./EngineSwitch";
import { ImageInput } from "../common/ImageInput";
import { useForm, Controller } from "react-hook-form";

type FormData = {
  name: string;
  description: string;
  engine: "cloud" | "on-chain";
  imageUrl?: string;
};

export interface NewAppDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NewAppDialog = memo(function NewAppDialog(
  props: NewAppDialogProps
) {
  const { control, register, reset, handleSubmit, formState } =
    useForm<FormData>({
      defaultValues: {
        engine: "cloud",
      },
      // FIXME: this values must be fetched from the server and passed as props
      // values: {
      //   name: "App!",
      //   description: "Awesome app",
      //   engine: "on-chain",
      //   imageUrl: "https://fastly.picsum.photos/id/40/88/88.jpg?hmac=XQ7fH1YgKvAv7BEJcBsiF7qmuOaVhlbYHHeT-8nTnuM",
      // }
    });

  const onSubmit = handleSubmit(async (data) => {
    //TODO: add saving profile logic
    console.log(data);
    try {
      await new Promise((res, rej) =>
        setTimeout(() => {
          Math.random() > 0.5 ? res({}) : rej(Error("saving error"));
        }, 3000)
      );
      console.log("saved");
      reset();
    } catch (error) {
      console.error(error);
      reset(data);
    }
  });

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form onSubmit={onSubmit}>
        <DialogHeader
          title="Create New App"
          icon={
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageInput
                  icon="apps"
                  imageUrl={field.value}
                  onImageUrlChange={field.onChange}
                  disabled={formState.isSubmitting}
                />
              )}
            />
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
            {/* FIXME: use textarea instead of input */}
            <FieldInput
              className="w-full font-rubik"
              placeholder="Add something helpful that will help you and your teammates identify your app. This is only visible to your team."
              type="text"
              {...register("description", { required: true })}
              readOnly={formState.isSubmitting}
              invalid={!!formState.errors.description}
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
