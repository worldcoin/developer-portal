import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { Input } from "@/components/Input";
import { Switcher } from "@/components/Switch";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { memo, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchKeysDocument } from "../../graphql/client/fetch-keys.generated";
import { useUpdateKeyMutation } from "./graphql/client/update-key.generated";

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
  const [updateKeyMutation, { loading: updatingKey }] = useUpdateKeyMutation();

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
            <b className="max-w-20 truncate ">{values.name}</b>
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
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />

      <DialogPanel className="md:max-w-[36rem]">
        <div className="grid w-full grid-cols-1 justify-items-center gap-y-8">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>

          <div className="grid w-full justify-items-center gap-y-4">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Edit API Key
            </Typography>
          </div>

          <form
            className="grid w-full gap-y-10"
            onSubmit={handleSubmit(submit)}
          >
            <Input
              register={register("name")}
              label="Key name"
              required
              errors={errors.name}
              placeholder="Staging_key"
            />

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="grid grid-cols-auto/1fr items-start justify-items-start gap-x-4 rounded-xl border border-grey-200 p-4">
                  <Switcher setEnabled={field.onChange} enabled={field.value} />

                  <div className="grid grid-cols-1 gap-y-1">
                    <Typography variant={TYPOGRAPHY.R3}>
                      Activate the API key
                    </Typography>

                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="text-grey-400"
                    >
                      Toggle to enable or disable this API key.
                    </Typography>
                  </div>
                </div>
              )}
            />

            <div className="grid w-full grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
              <DecoratedButton
                className="order-2 md:order-1"
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </DecoratedButton>

              <DecoratedButton
                className="order-1 whitespace-nowrap"
                type="submit"
              >
                Save Changes
              </DecoratedButton>
            </div>
          </form>
        </div>
      </DialogPanel>
    </Dialog>
  );
});
