"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchKeysDocument } from "../graphql/client/fetch-keys.generated";
import { useInsertKeyMutation } from "./graphql/client/create-key.generated";

const schema = yup
  .object()
  .shape({
    name: yup.string().required("A key name is required"),
  })
  .noUnknown();

type CreateKeyModal = {
  teamId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export type CreateKeyFormValues = yup.Asserts<typeof schema>;

export const CreateKeyModal = (props: CreateKeyModal) => {
  const { teamId, isOpen, setIsOpen } = props;
  const [insertKeyMutation, { loading: creatingKey }] = useInsertKeyMutation();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<CreateKeyFormValues>({
    resolver: yupResolver(schema),
  });

  const submit = async (values: CreateKeyFormValues) => {
    if (creatingKey) return;

    try {
      const result = await insertKeyMutation({
        variables: {
          name: values.name,
          teamId,
        },
        refetchQueries: [FetchKeysDocument],
      });
      if (result instanceof Error) {
        throw result;
      }
      toast.success(
        <span>
          New API key <b>{values.name}</b> was created
        </span>,
      );
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create API key: ", error);

      toast.error("Error occurred while creating API key.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />

      <DialogPanel className="md:max-w-[36rem]">
        <div className="grid grid-cols-1 justify-items-center gap-y-10">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>

          <div className="grid w-full justify-items-center gap-y-4">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Create a new API key
            </Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Create a secure API key to seamlessly connect with your World ID
              App.
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

            <div className="grid w-full gap-x-4 gap-y-2 md:grid-cols-2">
              <DecoratedButton
                className="order-2 md:order-1"
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </DecoratedButton>

              <DecoratedButton
                type="submit"
                disabled={!teamId}
                className="order-1 whitespace-nowrap"
              >
                Create new key
              </DecoratedButton>
            </div>
          </form>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
