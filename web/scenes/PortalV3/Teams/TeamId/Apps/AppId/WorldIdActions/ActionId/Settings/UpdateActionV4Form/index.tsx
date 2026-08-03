"use client";

import { CopyButton } from "@/components/CopyButton";
import { useAutosave } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave";
import { TextField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/TextField";
import { yupResolver } from "@hookform/resolvers/yup";
import { KeyboardEvent, useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  CreateActionSchemaV4,
  createActionSchemaV4,
} from "../../../page/CreateActionDialogV4/server/form-schema-v4";
import { GetSingleActionV4Query } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated";
import { updateActionV4ServerSide } from "./server";

type UpdateActionV4FormProps = {
  action: Pick<
    NonNullable<GetSingleActionV4Query["action_v4_by_pk"]>,
    "id" | "action" | "description"
  >;
  appId: string;
  canModify: boolean;
  onUpdated?: () => void;
};

export const UpdateActionV4Form = (props: UpdateActionV4FormProps) => {
  const { action, appId, canModify, onUpdated } = props;

  const form = useForm<CreateActionSchemaV4>({
    resolver: yupResolver(createActionSchemaV4),
    mode: "onChange",
    defaultValues: {
      action: action.action,
      description: action.description || "",
    },
  });
  const {
    formState: { errors },
  } = form;
  const { field: description } = useController({
    control: form.control,
    name: "description",
  });

  const save = useCallback(
    async (values: CreateActionSchemaV4, _signal: AbortSignal) => {
      const result = await updateActionV4ServerSide(values, action.id, appId);

      if (!result.success) {
        throw new Error(result.message);
      }

      onUpdated?.();
    },
    [action.id, appId, onUpdated],
  );

  const autosave = useAutosave<CreateActionSchemaV4>({
    form,
    save,
    enabled: canModify,
    onStatus: (status) => {
      if (status.state === "saved") {
        toast.success("Action description updated");
      }
      if (status.state === "error") {
        toast.error(status.error.message);
      }
    },
  });

  const handleDescriptionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <TextField
        label="Action identifier"
        value={action.action}
        readOnly
        muted
        trailing={
          <CopyButton
            fieldName="Action identifier"
            fieldValue={action.action}
            className="!pr-0"
            iconClassName="size-5 text-portal-ink"
          />
        }
      />

      <TextField
        label="Short description"
        name={description.name}
        value={description.value ?? ""}
        onChange={description.onChange}
        onKeyDown={handleDescriptionKeyDown}
        onBlur={() => {
          description.onBlur();
          void autosave.flush();
        }}
        disabled={!canModify}
        error={errors.description?.message}
      />
    </div>
  );
};
