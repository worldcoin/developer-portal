"use client";

import { Button } from "@/components/Button";
import {
  FormDialog,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Notification } from "@/components/Notification";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@apollo/client/react";
import clsx from "clsx";
import { atom, useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchTeamMembersDocument,
  FetchTeamMembersQuery,
} from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { permissionsDialogAtom } from "../PermissionsDialog";
import { EditRoleDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/List/EditRoleDialog/graphql/client/edit-role.generated";

const roles = [Role_Enum.Owner, Role_Enum.Admin, Role_Enum.Member];

export const editRoleDialogAtom = atom(false);

const schema = yup
  .object({
    email: yup.string().nullable(),
    role: yup
      .object({
        label: yup.string(),
        value: yup.string().oneOf(Object.values(Role_Enum)),
      })
      .noUnknown(),
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

export const EditRoleDialog = (props: {
  membership: FetchTeamMembersQuery["members"][number] | null;
}) => {
  const [isOpened, setIsOpened] = useAtom(editRoleDialogAtom);
  const [permissionsOpened, setPermissionsOpened] = useAtom(
    permissionsDialogAtom,
  );
  const { teamId } = useParams() as { teamId: string };

  const roles = useMemo(
    () => [
      { label: "Owner", value: Role_Enum.Owner },
      { label: "Admin", value: Role_Enum.Admin },
      { label: "Member", value: Role_Enum.Member },
    ],
    [],
  );

  const defaultValues = useMemo(() => {
    if (!props.membership) {
      return null;
    }

    return {
      email: props.membership?.user.email,
      role: roles.find((role) => role.value === props.membership?.role),
    };
  }, [props.membership, roles]);

  const {
    register,
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: { label: "", value: Role_Enum.Member },
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const [editRole] = useMutation(EditRoleDocument);

  const onClose = useCallback(() => {
    if (permissionsOpened) {
      return;
    }

    setIsOpened(false);

    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, permissionsOpened, reset, setIsOpened]);

  const submit = useCallback(
    async (values: FormValues) => {
      if (!props.membership) {
        return;
      }

      try {
        await editRole({
          variables: {
            membershipId: props.membership.id,
            role: values.role.value,
          },

          refetchQueries: [FetchTeamMembersDocument],
        });

        toast.success("Role updated successfully");
      } catch (error) {
        toast.error("Error updating role");
      }

      setIsOpened(false);
    },
    [editRole, props.membership, setIsOpened],
  );

  return (
    <FormDialog
      open={isOpened}
      onClose={onClose}
      title="Edit role"
      closeLabel="Close edit role dialog"
    >
      <div className="grid gap-5">
        <Notification variant="info" className="rounded-8 p-3">
          <Typography variant={TYPOGRAPHY.R4}>
            Please note that various roles are granted access to distinct sets
            of data. For further details, please refer to our{" "}
            <Button
              type="button"
              onClick={() => setPermissionsOpened(true)}
              className="inline text-blue-500"
            >
              permissions list
            </Button>
            .
          </Typography>
        </Notification>

        <form onSubmit={handleSubmit(submit)} className="grid w-full gap-5">
          <input
            disabled
            aria-label="Email"
            {...register("email")}
            className={`${formDialogInputClassName} max-md:hidden`}
          />

          <Controller
            control={control}
            name="role"
            render={({ field }) => {
              return (
                <>
                  <div className="relative max-md:hidden">
                    <label className={formDialogLabelClassName}>Role</label>

                    <Select value={field.value} onChange={field.onChange}>
                      <SelectButton className="flex h-11 w-full items-center justify-between rounded-8 border border-grey-200 bg-white px-3 font-world text-14 text-portal-text outline-hidden focus:ring-2 focus:ring-grey-200">
                        {field.value?.label}
                        <CaretIcon />
                      </SelectButton>

                      <SelectOptions className="mt-2">
                        {roles.map((option, index) => (
                          <SelectOption
                            key={`edit-role-option-${index}`}
                            value={option}
                            className="size-full transition-colors hover:bg-grey-100"
                          >
                            {option.label}
                          </SelectOption>
                        ))}
                      </SelectOptions>
                    </Select>
                  </div>

                  <div className="grid gap-y-3 md:hidden">
                    <span className={formDialogLabelClassName}>Role</span>
                    {roles.map((option, index) => (
                      <button
                        key={`edit-role-option-${index}`}
                        type="button"
                        className="grid h-11 grid-cols-auto/1fr items-center gap-x-3 rounded-8 border border-grey-200 px-3 text-start font-world text-14"
                        onClick={() => field.onChange(option)}
                      >
                        <div
                          className={clsx(
                            "flex size-5 items-center justify-center rounded-full before:rounded-full before:bg-grey-0",
                            {
                              "bg-grey-900 before:size-2":
                                option.value === field.value?.value,
                              "bg-grey-300 before:size-4":
                                option.value !== field.value?.value,
                            },
                          )}
                        />

                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              );
            }}
          />

          <div className="grid w-full gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
            >
              Change role
            </button>
          </div>
        </form>
      </div>
    </FormDialog>
  );
};
