import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useInsertKeyMutation } from "./graphql/client/create-key.generated";
import { FetchKeysDocument } from "../graphql/client/fetch-keys.generated";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  name: yup.string().required("A key name is required"),
});

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
        },
        context: { headers: { team_id: teamId } },
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
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error occurred while creating API key.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />
      <DialogPanel>
        <div className="max-w-[580px] grid grid-cols-1 gap-y-10 justify-items-center">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>
          <div className="grid gap-y-4 w-full justify-items-center">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Create a new API key
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Create a secure API key to seamlessly connect with your World ID
              App.
            </Typography>
          </div>
          <form
            className="w-full grid gap-y-10"
            onSubmit={handleSubmit(submit)}
          >
            <Input
              register={register("name")}
              label="Key name"
              required
              errors={errors.name}
              placeholder="Staging_key"
            />
            <div className="grid grid-cols-2 w-full gap-x-4">
              <DecoratedButton
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </DecoratedButton>
              <DecoratedButton type="submit">Create new key</DecoratedButton>
            </div>
          </form>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
