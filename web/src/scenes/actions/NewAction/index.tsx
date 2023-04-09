import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldInput } from "../common/Form/FieldInput";
import { FieldLabel } from "@/components/FieldLabel";
import { useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Illustration } from "src/components/Auth/Illustration";
import { FieldTextArea } from "../common/Form/FieldTextArea";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import slugify from "slugify";
import { useInsertAction } from "../hooks";
import { useAppStore } from "src/stores/appStore";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { toast } from "react-toastify";
import { ApolloError } from "@apollo/client";
import { VerificationSelect } from "@/scenes/actions/common/VerificationSelect";

const schema = yup.object({
  name: yup.string().required("This field is required"),
  description: yup.string(),
  action: yup.string().required("This field is required"),
  maxVerifications: yup.number().required("This field is required"),
});

export type NewActionFormValues = yup.Asserts<typeof schema>;

const getActionsStore = (store: IActionStore) => ({
  isOpened: store.isNewActionModalOpened,
  setIsOpened: store.setIsNewActionModalOpened,
  newAction: store.newAction,
  setNewAction: store.setNewAction,
});

export function NewAction() {
  const currentApp = useAppStore((store) => store.currentApp);
  const { isOpened, setIsOpened } = useActionStore(getActionsStore);
  const { insertAction, loading, error: insertError } = useInsertAction();

  const {
    control,
    register,
    formState: { errors, dirtyFields },
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
  } = useForm<NewActionFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      maxVerifications: 1,
    },
  });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name !== "name") {
        return;
      }

      setValue("action", slugify(value.name ?? "", { lower: true }), {
        shouldDirty: true,
      });
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  const submit = useCallback(
    async (values: NewActionFormValues) => {
      if (!currentApp?.id) {
        return toast.error("Error occurred while creating action.");
      }

      try {
        const result = await insertAction({
          name: values.name,
          description: values.description,
          action: values.action,
          app_id: currentApp.id,

          external_nullifier: IDKitInternal.generateExternalNullifier(
            currentApp.id,
            values.action
          ).digest,
        });

        if (result instanceof Error) {
          throw result;
        }
      } catch (error) {
        if (
          (error as ApolloError).graphQLErrors[0].extensions.code ===
          "constraint-violation"
        ) {
          setError("action", {
            type: "custom",
            message: "This action already exists.",
          });

          return toast.error(
            "An action with this identifier already exists for this app. Please change the 'action' identifier."
          );
        }

        return toast.error("Error occurred while creating action.");
      }

      setIsOpened(false);
      reset();
      toast.success(`Action "${values.name}" created.`);
    },
    [currentApp?.id, insertAction, reset, setError, setIsOpened]
  );

  const isFormValid = useMemo(
    () =>
      !errors.name && !errors.action && dirtyFields.name && dirtyFields.action,
    [dirtyFields.action, dirtyFields.name, errors.action, errors.name]
  );

  return (
    <Dialog
      panelClassName="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={() => setIsOpened(false)}
    >
      <DialogHeader
        icon={<Illustration icon="notepad" />}
        title="Create New Action"
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
            autoComplete="off"
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

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel required className="font-rubik">
            Action identifier
          </FieldLabel>
          {/* helper: "This is the identifier you will use in IDKit and any API calls." */}
          {/* FIXME: should only allow letters, numbers, underscore (_) & hyphen (-) */}
          <FieldInput
            register={register("action")}
            errors={errors.action}
            isDirty={dirtyFields.action}
            className="w-full font-rubik"
            placeholder="proposal-102"
            disabled={loading}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel required className="font-rubik">
            Choose a maximum number of verifications
          </FieldLabel>
          <Controller
            name="maxVerifications"
            control={control}
            render={({ field }) => {
              return (
                <VerificationSelect
                  size="lg"
                  fullWidth
                  dropUp
                  value={field.value}
                  onChange={field.onChange}
                />
              );
            }}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-[56px] mt-12 font-medium"
          disabled={!isFormValid}
        >
          Create New Action
        </Button>
      </form>
    </Dialog>
  );
}
