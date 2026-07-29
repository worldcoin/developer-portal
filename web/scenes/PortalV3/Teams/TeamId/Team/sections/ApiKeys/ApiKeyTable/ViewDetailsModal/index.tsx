import {
  FormDialog,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { Switcher } from "@/components/Switch";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@apollo/client/react";
import { memo, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import * as yup from "yup";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { UpdateKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ViewDetailsModal/graphql/client/update-key.generated";

const schema = yup
  .object()
  .shape({
    name: yup.string().required("A key name is required"),
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

  // Add use effect here so default values update when the props change
  useEffect(() => {
    reset({
      name: name,
      isActive: isActive,
    });
  }, [name, isActive, reset]);

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
      title="Edit API Key"
      closeLabel="Close edit API key dialog"
    >
      <form className="grid w-full gap-5" onSubmit={handleSubmit(submit)}>
        <div>
          <label
            htmlFor="edit-api-key-name"
            className={formDialogLabelClassName}
          >
            Key name <span className="text-system-error-500">*</span>
          </label>
          <input
            id="edit-api-key-name"
            {...register("name")}
            placeholder="Staging_key"
            aria-invalid={Boolean(errors.name)}
            className={twMerge(
              formDialogInputClassName,
              errors.name && "border-system-error-400",
            )}
          />
          {errors.name?.message ? (
            <p className={formDialogErrorClassName}>{errors.name.message}</p>
          ) : null}
        </div>

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="grid grid-cols-auto/1fr items-start justify-items-start gap-x-3 rounded-8 border border-grey-200 p-3">
              <Switcher setEnabled={field.onChange} enabled={field.value} />

              <div className="grid grid-cols-1 gap-y-1 font-world">
                <p className="text-13 font-medium text-portal-text">
                  Activate the API key
                </p>

                <p className="text-12 leading-[1.4] text-portal-muted">
                  Toggle to enable or disable this API key.
                </p>
              </div>
            </div>
          )}
        />

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            Save Changes
          </button>
        </div>
      </form>
    </FormDialog>
  );
});
