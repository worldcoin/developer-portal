import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldLabel } from "@/components/FieldLabel";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Illustration } from "src/components/Auth/Illustration";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import useKeys from "src/hooks/useKeys";
import { FieldInput } from "../FieldInput";

const schema = yup.object({
  name: yup.string().required("This field is required"),
});

export type NewKeyFormValues = yup.Asserts<typeof schema>;

const getKeyStore = (store: IKeyStore) => ({
  isOpened: store.isNewKeyModalOpened,
  setIsOpened: store.setIsNewKeyModalOpened,
});

export function NewKey() {
  const { isOpened, setIsOpened } = useKeyStore(getKeyStore);
  const { createKey, isLoading } = useKeys();

  const {
    register,
    formState: { errors, dirtyFields },
    handleSubmit,
    reset,
  } = useForm<NewKeyFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const submit = useCallback(
    async (values: NewKeyFormValues) => {
      try {
        const result = await createKey({
          name: values.name,
        });

        if (result instanceof Error) {
          throw result;
        }
      } catch (error) {
        return toast.error("Error occurred while creating API key.");
      }

      setIsOpened(false);
      reset();
    },
    [createKey, reset, setIsOpened]
  );

  const isFormValid = useMemo(
    () => !errors.name && dirtyFields.name,
    [dirtyFields.name, errors.name]
  );

  return (
    <Dialog
      panelClassName="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={() => setIsOpened(false)}
    >
      <DialogHeader icon={<Illustration icon="api" />} title="Create New Key" />
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
            placeholder="Staging Key"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-[56px] mt-12 font-medium"
          disabled={!isFormValid}
        >
          Create New Key
        </Button>
      </form>
    </Dialog>
  );
}
