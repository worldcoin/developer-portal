import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { FetchKeysDocument } from "../../graphql/client/fetch-keys.generated";
import { toast } from "react-toastify";
import { useUpdateKeyMutation } from "./graphql/client/update-key.generated";
import { Switcher } from "@/components/Switch";
import { memo, useEffect } from "react";

const schema = yup.object().shape({
  name: yup.string().required("A key name is required"),
  isActive: yup.boolean().default(true),
});

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
        context: { headers: { team_id: teamId } },
        refetchQueries: [FetchKeysDocument],
      });
      if (result instanceof Error) {
        throw result;
      }
      toast.success(
        <span>
          API key <b>{values.name}</b> was updated
        </span>,
      );
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error occurred while updating API key.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />
      <DialogPanel>
        <div className="max-w-[580px] min-w-96 grid grid-cols-1 gap-y-8 justify-items-center w-full">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>
          <div className="grid gap-y-4 w-full justify-items-center">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Edit API Key
            </Typography>
          </div>
          <form
            className="grid gap-y-10 w-full"
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
                <div className="grid grid-cols-auto/1fr gap-x-4 items-start justify-items-start rounded-xl border border-grey-200 p-4">
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
            <div className="grid grid-cols-2 w-full gap-x-4">
              <DecoratedButton
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </DecoratedButton>
              <DecoratedButton type="submit">Save Changes</DecoratedButton>
            </div>
          </form>
        </div>
      </DialogPanel>
    </Dialog>
  );
});
