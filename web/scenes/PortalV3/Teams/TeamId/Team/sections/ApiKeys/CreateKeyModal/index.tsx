"use client";
import {
  FormDialog,
  FormDialogButton,
  FormDialogFieldError,
  FormDialogFooter,
  FormDialogInput,
  FormDialogLabel,
} from "@/components/FormDialog";
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
  // Creation is two chained mutations (insert, then reset to obtain the secret).
  // Tracking "in flight" with one explicit flag instead of the two Apollo
  // loading flags matters: those both read false in the render between the
  // mutations, which would briefly unlock dismissal mid-operation.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insertKeyMutation] = useMutation(InsertKeyDocument);
  const [resetApiKeyMutation] = useMutation(ResetApiKeyDocument);

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
    // Fresh session on open: covers reopening during an interrupted leave
    // transition, where afterLeave (the usual cleanup) never fired.
    if (isOpen) {
      setCreatedKey(null);
      reset();
    }
  }, [isOpen, reset]);

  const close = () => {
    requestIdRef.current += 1;
    setIsOpen(false);
  };

  // Clear content only after the leave transition: the dialog keeps rendering
  // while it fades out, and clearing on close snaps the created-key reveal
  // back to the create form mid-fade (visible flicker).
  const afterLeave = () => {
    reset();
    setCreatedKey(null);
  };

  const submit = async (values: CreateKeyFormValues) => {
    if (isSubmitting) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSubmitting(true);

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
    } finally {
      // Only the newest attempt owns the flag, so a superseded one cannot
      // unlock the dialog while its replacement is still running.
      if (requestIdRef.current === requestId) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={close}
      afterLeave={afterLeave}
      // The key exists server-side the moment the first mutation lands, and the
      // second returns its only copy: dismissing between them leaves a key in
      // the table that can never be revealed. Hold the user until the reveal.
      dismissable={!isSubmitting}
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

          <FormDialogButton onClick={close}>Done</FormDialogButton>
        </div>
      ) : (
        <form className="grid w-full gap-y-6" onSubmit={handleSubmit(submit)}>
          <p className="font-world text-14 leading-[1.5] text-portal-muted">
            Create a secure API key to seamlessly connect with your App.
          </p>

          <div>
            <FormDialogLabel htmlFor="create-api-key-name">
              Key name <span aria-hidden="true">*</span>
            </FormDialogLabel>

            <FormDialogInput
              id="create-api-key-name"
              {...register("name")}
              placeholder="api_key_123"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "create-api-key-name-error" : undefined
              }
            />

            {errors.name?.message && (
              <FormDialogFieldError id="create-api-key-name-error">
                {errors.name.message}
              </FormDialogFieldError>
            )}
          </div>

          <FormDialogFooter>
            <FormDialogButton
              variant="secondary"
              disabled={isSubmitting}
              onClick={close}
            >
              Cancel
            </FormDialogButton>

            <FormDialogButton
              type="submit"
              disabled={!teamId}
              loading={isSubmitting}
              // Keeps an accessible name while the label is a spinner.
              aria-label="Create new key"
            >
              Create new key
            </FormDialogButton>
          </FormDialogFooter>
        </form>
      )}
    </FormDialog>
  );
};
