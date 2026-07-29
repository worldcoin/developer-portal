"use client";
import {
  FormDialog,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useMutation } from "@apollo/client/react";
import { ApiKeySecretFields } from "../ApiKeySecretFields";
import { ResetApiKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { InsertKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/CreateKeyModal/graphql/client/create-key.generated";

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
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const isOpenRef = useRef(isOpen);
  const requestIdRef = useRef(0);
  const [insertKeyMutation, { loading: creatingKey }] =
    useMutation(InsertKeyDocument);
  const [resetApiKeyMutation, { loading: revealingKey }] =
    useMutation(ResetApiKeyDocument);

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<CreateKeyFormValues>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const close = () => {
    requestIdRef.current += 1;
    reset();
    setCreatedKey(null);
    setIsOpen(false);
  };

  const submit = async (values: CreateKeyFormValues) => {
    if (creatingKey || revealingKey) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const result = await insertKeyMutation({
        variables: {
          name: values.name,
          teamId,
        },
        refetchQueries: [FetchKeysDocument],
      });
      if (result instanceof Error || Boolean(result?.error)) {
        throw result;
      }

      const createdApiKey = result.data?.insert_api_key_one;
      if (!createdApiKey?.id) {
        throw new Error("No API key created");
      }

      const resetResult = await resetApiKeyMutation({
        variables: {
          id: createdApiKey.id,
          team_id: teamId,
        },
        refetchQueries: [FetchKeysDocument],
      });
      if (resetResult instanceof Error || Boolean(resetResult?.error)) {
        throw resetResult;
      }

      const apiKey = resetResult.data?.reset_api_key?.api_key;
      if (!apiKey) {
        throw new Error("No API key returned");
      }

      if (!isOpenRef.current || requestIdRef.current !== requestId) {
        return;
      }

      setCreatedKey(apiKey);
      toast.success(
        <span>
          New API key <b>{values.name}</b> was created
        </span>,
      );
      reset();
    } catch (error) {
      console.error("Failed to create API key: ", error);

      if (!isOpenRef.current || requestIdRef.current !== requestId) {
        return;
      }

      toast.error("Error occurred while creating API key.");
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={close}
      closeLabel="Close API key dialog"
      title={createdKey ? "API key created" : "Create a new API key"}
      panelClassName={
        createdKey
          ? "max-h-[calc(100dvh-2rem)] md:w-[544px] md:max-w-[calc(100vw-2rem)]"
          : undefined
      }
      bodyClassName={createdKey ? "min-h-0 overflow-y-auto" : undefined}
    >
      {createdKey ? (
        <div className="grid w-full gap-y-5">
          <p className="font-world text-14 leading-[1.5] text-portal-muted">
            Your new key is ready. Save it now because you {"won't"} be able to
            see it again.
          </p>

          <ApiKeySecretFields apiKey={createdKey} />

          <button
            type="button"
            className={formDialogPrimaryActionClassName}
            onClick={close}
          >
            Done
          </button>
        </div>
      ) : (
        <form className="grid w-full gap-y-6" onSubmit={handleSubmit(submit)}>
          <p className="font-world text-14 leading-[1.5] text-portal-muted">
            Create a secure API key to seamlessly connect with your App.
          </p>

          <div>
            <label
              htmlFor="create-api-key-name"
              className={formDialogLabelClassName}
            >
              Key name <span aria-hidden="true">*</span>
            </label>

            <input
              id="create-api-key-name"
              {...register("name")}
              className={formDialogInputClassName}
              placeholder="api_key_123"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "create-api-key-name-error" : undefined
              }
            />

            {errors.name?.message && (
              <p
                id="create-api-key-name-error"
                className={formDialogErrorClassName}
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid w-full gap-3 md:grid-cols-2">
            <button
              className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
              type="button"
              onClick={close}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!teamId || creatingKey || revealingKey}
              className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
            >
              {creatingKey || revealingKey ? (
                <SpinnerIcon className="size-5 animate-spin" />
              ) : (
                "Create new key"
              )}
            </button>
          </div>
        </form>
      )}
    </FormDialog>
  );
};
