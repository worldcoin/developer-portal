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
    <Dialog open={isOpen} onClose={close}>
      <DialogOverlay />

      <DialogPanel
        className={
          createdKey
            ? "max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-20 p-5 sm:p-6 md:w-[34rem] md:max-w-[calc(100vw-2rem)]"
            : "md:max-w-[36rem]"
        }
      >
        <div
          className={
            createdKey
              ? "grid grid-cols-1 justify-items-center gap-y-5"
              : "grid grid-cols-1 justify-items-center gap-y-10"
          }
        >
          {createdKey ? (
            <div className="flex size-12 items-center justify-center rounded-full border border-blue-150 bg-blue-50 text-blue-500">
              <KeyIcon className="size-5" />
            </div>
          ) : (
            <CircleIconContainer variant={"info"}>
              <KeyIcon className="text-blue-500" />
            </CircleIconContainer>
          )}

          <div
            className={
              createdKey
                ? "grid w-full justify-items-center gap-y-2 text-center"
                : "grid w-full justify-items-center gap-y-4 text-center"
            }
          >
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              {createdKey ? "API key created" : "Create a new API key"}
            </Typography>

            <Typography
              variant={createdKey ? TYPOGRAPHY.R4 : TYPOGRAPHY.R3}
              className={
                createdKey ? "max-w-[24rem] text-grey-500" : "text-grey-500"
              }
            >
              {createdKey
                ? "Your new key is ready. Save it now because you won't be able to see it again."
                : "Create a secure API key to seamlessly connect with your App."}
            </Typography>
          </div>

          {createdKey ? (
            <div className="grid w-full gap-y-5">
              <ApiKeySecretFields apiKey={createdKey} />

              <DecoratedButton
                type="button"
                className="min-h-11"
                onClick={close}
              >
                Done
              </DecoratedButton>
            </div>
          ) : (
            <form
              className="grid w-full gap-y-10"
              onSubmit={handleSubmit(submit)}
            >
              <Input
                register={register("name")}
                label="Key name"
                required
                errors={errors.name}
                placeholder="api_key_123"
              />

              <div className="grid w-full gap-x-4 gap-y-2 md:grid-cols-2">
                <DecoratedButton
                  className="order-2 md:order-1"
                  type="button"
                  variant="secondary"
                  onClick={close}
                >
                  Cancel
                </DecoratedButton>

                <DecoratedButton
                  type="submit"
                  disabled={!teamId || creatingKey || revealingKey}
                  loading={creatingKey || revealingKey}
                  className="order-1 whitespace-nowrap"
                >
                  Create new key
                </DecoratedButton>
              </div>
            </form>
          )}
        </div>
      </DialogPanel>
    </Dialog>
  );
};
