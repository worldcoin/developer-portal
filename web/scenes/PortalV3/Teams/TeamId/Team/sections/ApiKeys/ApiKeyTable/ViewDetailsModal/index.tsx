import { CircleIconContainer } from "@/components/CircleIconContainer";
import {
  FormDialog,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { Switcher } from "@/components/Switch";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@apollo/client/react";
import { memo, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { UpdateKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ViewDetailsModal/graphql/client/update-key.generated";

const schema = yup
  .object()
  .shape({
    name: yup.string().trim().required("A key name is required"),
    isActive: yup.boolean().default(true),
  })
  .noUnknown();

type ViewDetailsModalProps = {
  teamId?: string;
  isOpen: boolean;
  name?: string;
  isActive: boolean;
  keyId?: string;
  setIsOpen: (isOpen: boolean) => void;
};

export type ViewDetailsFormValues = yup.Asserts<typeof schema>;

export const ViewDetailsModal = memo(function ViewDetailsModal(
  props: ViewDetailsModalProps,
) {
  const { teamId, isOpen, name, isActive, keyId, setIsOpen } = props;
  const [updateKeyMutation, { loading: updatingKey }] =
    useMutation(UpdateKeyDocument);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm<ViewDetailsFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: name,
      isActive: isActive,
    },
  });

  // Start each edit session with saved values, discarding any canceled edits.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      name: name,
      isActive: isActive,
    });
  }, [isOpen, keyId, name, isActive, reset]);

  const submit = async (values: ViewDetailsFormValues) => {
    if (updatingKey || !keyId) return;
    try {
      const result = await updateKeyMutation({
        variables: {
          id: keyId,
          name: values.name,
          is_active: values.isActive ?? false,
        },

        refetchQueries: [FetchKeysDocument],
      });
      if (result instanceof Error) {
        throw result;
      }
      toast.success(
        <span className="">
          API key{" "}
          <span className="inline-flex">
            <b className="max-w-20 truncate">{values.name}</b>
          </span>{" "}
          was updated
        </span>,
      );
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update API Key: ", error);
      toast.error("Error occurred while updating API key.");
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      dismissable={!updatingKey}
      title="Edit API key"
      closeLabel="Close edit API key dialog"
    >
      <div className="grid w-full gap-y-6">
        <div className="grid justify-items-center">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>
        </div>

        <form className="grid w-full gap-y-6" onSubmit={handleSubmit(submit)}>
          <div>
            <label
              htmlFor="edit-api-key-name"
              className={formDialogLabelClassName}
            >
              Key name <span aria-hidden="true">*</span>
            </label>
            <input
              id="edit-api-key-name"
              {...register("name")}
              className={formDialogInputClassName}
              placeholder="Staging_key"
              disabled={updatingKey}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "edit-api-key-name-error" : undefined
              }
            />
            {errors.name?.message ? (
              <p
                id="edit-api-key-name-error"
                className={formDialogErrorClassName}
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="grid grid-cols-auto/1fr items-start justify-items-start gap-x-4 rounded-xl border border-grey-200 p-4">
                <Switcher
                  setEnabled={field.onChange}
                  enabled={field.value}
                  disabled={updatingKey}
                />

                <div className="grid grid-cols-1 gap-y-1">
                  <Typography variant={TYPOGRAPHY.R3}>
                    Activate the API key
                  </Typography>

                  <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
                    Toggle to enable or disable this API key.
                  </Typography>
                </div>
              </div>
            )}
          />

          <div className="grid w-full gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={updatingKey}
              className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingKey}
              className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </FormDialog>
  );
});
