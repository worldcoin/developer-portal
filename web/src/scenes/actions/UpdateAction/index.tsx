import { memo, useCallback, useEffect, useMemo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "../common/Form/FieldInput";
import { FieldTextArea } from "../common/Form/FieldTextArea";
import { useForm } from "react-hook-form";
import { FieldLabel } from "@/components/FieldLabel";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useUpdateAction } from "../hooks";
import { Button } from "@/components/Button";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import { toast } from "react-toastify";
import { ActionValue } from "../common/ActionValue";

const schema = yup.object({
  name: yup.string(),
  description: yup.string(),
});

export type UpdateActionFormValues = yup.Asserts<typeof schema>;

const getActionsStore = (store: IActionStore) => ({
  isOpened: store.isUpdateActionModalOpened,
  setIsOpened: store.setIsUpdateActionModalOpened,
  actionToUpdate: store.actionToUpdate,
});

export const UpdateAction = memo(function UpdateAction() {
  const { isOpened, setIsOpened, actionToUpdate } =
    useActionStore(getActionsStore);

  const defaultValues = useMemo(
    () => ({
      name: actionToUpdate?.name ?? "",
      description: actionToUpdate?.description ?? "",
    }),
    [actionToUpdate]
  );

  const {
    register,
    formState: { errors, dirtyFields },
    handleSubmit,
    reset,
  } = useForm<UpdateActionFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { updateAction, loading } = useUpdateAction();

  const submit = useCallback(
    (values: UpdateActionFormValues) => {
      if (!actionToUpdate) {
        return toast.error("Error while updating action");
      }

      updateAction(actionToUpdate.id, values);
      setIsOpened(false);
    },
    [actionToUpdate, setIsOpened, updateAction]
  );

  const isFormValid = useMemo(
    () => dirtyFields.name || dirtyFields.description,
    [dirtyFields.description, dirtyFields.name]
  );

  return (
    <Dialog
      panelClassName="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={() => setIsOpened(false)}
    >
      <DialogHeader
        icon={<Illustration icon="notepad" />}
        title="Update Action"
        titleClassName="!pb-2"
        additional={
          <ActionValue className="mb-8" value={actionToUpdate?.action ?? ""} />
        }
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
            disabled={loading}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel className="font-rubik">Description</FieldLabel>
          {/* helper: "Tell your users what the action is about. Shown in the World App." */}
          {/* FIXME: Max length 80 chars (API enforced) */}
          {/* FIXME: Let's actually make this required and change the "(optional) for (public)" */}
          <FieldTextArea
            register={register("description")}
            errors={errors.description}
            isDirty={dirtyFields.description}
            className="w-full font-rubik"
            placeholder="Cast your vote on proposal #102"
            disabled={loading}
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
