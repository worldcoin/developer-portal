import { memo, useCallback, useEffect, useMemo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "../FieldInput";
import { Controller, useForm } from "react-hook-form";
import { FieldLabel } from "@/components/FieldLabel";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/Button";
import { toast } from "react-toastify";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import useKeys from "src/hooks/useKeys";
import { Switch } from "@headlessui/react";
import { SwitchOption } from "src/components/Layout/NewAppDialog/Switch";

const schema = yup.object({
  name: yup.string(),
  is_active: yup.boolean(),
});

export type UpdateKeyFormValues = yup.Asserts<typeof schema>;

const getKeyStore = (store: IKeyStore) => ({
  currentKey: store.currentKey,
  setCurrentKey: store.setCurrentKey,
  isOpened: store.isUpdateKeyModalOpened,
  setIsOpened: store.setIsUpdateKeyModalOpened,
});

export const UpdateKey = memo(function UpdateKey() {
  const { currentKey, isOpened, setCurrentKey, setIsOpened } =
    useKeyStore(getKeyStore);

  const defaultValues = useMemo(
    () => ({
      name: currentKey?.name ?? "",
      is_active: currentKey?.is_active ?? true,
    }),
    [currentKey]
  );

  const {
    register,
    formState: { errors, dirtyFields },
    handleSubmit,
    reset,
  } = useForm<UpdateKeyFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { updateKey, isLoading } = useKeys();

  const submit = useCallback(
    async (values: UpdateKeyFormValues) => {
      if (!currentKey) {
        return toast.error("Error while updating API key");
      }

      await updateKey({
        id: currentKey.id,
        name: values.name!,
        is_active: values.is_active!,
      });

      setIsOpened(false);
      setCurrentKey(null);
    },
    [currentKey, setCurrentKey, setIsOpened, updateKey]
  );

  const close = useCallback(() => {
    setIsOpened(false);
    setCurrentKey(null);
  }, [setCurrentKey, setIsOpened]);

  const isFormValid = useMemo(
    () => dirtyFields.name || dirtyFields.is_active,
    [dirtyFields.is_active, dirtyFields.name]
  );

  return (
    <Dialog
      panelClassName="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={close}
    >
      <DialogHeader
        icon={<Illustration icon="api" />}
        title="Update Key"
        titleClassName="!pb-2"
      />

      <form onSubmit={handleSubmit(submit)}>
        <div className="flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Name
          </FieldLabel>

          <FieldInput
            register={register("name")}
            errors={errors.name}
            isDirty={dirtyFields.name}
            className="w-full font-rubik"
            placeholder="Proposal #102"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-[56px] mt-12 text-base"
          disabled={!isFormValid}
        >
          Save
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full h-[56px] mt-3 text-base"
          onClick={() => {
            setIsOpened(false);
            reset(defaultValues);
          }}
        >
          Cancel
        </Button>
      </form>
    </Dialog>
  );
});
