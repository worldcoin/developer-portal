import { memo, useMemo } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { useForm, Controller } from "react-hook-form";
import { EngineType } from "src/lib/types";
import { Illustration } from "src/components/Auth/Illustration";
import { AppModel } from "src/lib/models";
import useApps from "src/hooks/useApps";
import { FieldTextArea } from "src/components/FieldTextArea";
import { Switch, SwitchOption } from "./Switch";

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
      mode: "onChange",
    });

  const onSubmit = handleSubmit(async (data) => {
    await createNewApp(data);
    props.onClose();
    reset();
  });

  const isValid = useMemo(
    () =>
      !formState.isSubmitting &&
      !Boolean(formState.errors.name) &&
      formState.dirtyFields.name,
    [formState.dirtyFields.name, formState.errors.name, formState.isSubmitting]
  );

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
              <Switch>
                <SwitchOption
                  icon="api"
                  title="Staging"
                  description="Testing environment for code changes before public release"
                  checked={field.value === true}
                  onCheckedChange={() => field.onChange(true)}
                  disabled={formState.isSubmitting}
                />

                <SwitchOption
                  icon="rocket"
                  title="Production"
                  description="Live environment accessible to end-users"
                  checked={field.value === false}
                  onCheckedChange={() => field.onChange(false)}
                  disabled={formState.isSubmitting}
                />
              </Switch>
            )}
          />

          <Controller
            name="engine"
            control={control}
            render={({ field }) => (
              <Switch>
                <SwitchOption
                  icon="cloud"
                  title="Cloud"
                  description="For actions that are triggered with the API or Sign in with World ID."
                  easiest
                  checked={field.value === EngineType.Cloud}
                  onCheckedChange={() => field.onChange(EngineType.Cloud)}
                  disabled={formState.isSubmitting}
                />

                <SwitchOption
                  icon="on-chain"
                  title="On-chain"
                  description="For actions that are validated and executed on the blockchain."
                  checked={field.value === EngineType.OnChain}
                  onCheckedChange={() => field.onChange(EngineType.OnChain)}
                  disabled={formState.isSubmitting}
                />
              </Switch>
            )}
          />

          <Button
            className="w-full h-[56px] mt-12 font-medium"
            type="submit"
            disabled={!isValid}
          >
            Create New App
          </Button>
        </div>
      </form>
    </Dialog>
  );
});
