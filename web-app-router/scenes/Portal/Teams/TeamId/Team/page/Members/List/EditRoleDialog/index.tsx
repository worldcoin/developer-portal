"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { UserEditIcon } from "@/components/Icons/UserEditIcon";
import { atom, useAtom } from "jotai";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Link } from "@/components/Link";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { Role_Enum } from "@/graphql/graphql";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { DecoratedButton } from "@/components/DecoratedButton";
import {
  FetchMembershipsDocument,
  FetchMembershipsQuery,
} from "../graphql/client/fetch-members.generated";
import { useCallback, useEffect, useMemo } from "react";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { useEditRoleMutation } from "./graphql/client/edit-role.generated";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/components/Button";
import { permissionsDialogAtom } from "../PermissionsDialog";

export const editRoleDialogAtom = atom(false);

const schema = yup.object({
  email: yup.string().nullable(),
  role: yup.object({
    label: yup.string(),
    value: yup.string().oneOf(Object.values(Role_Enum)),
  }),
});

type FormValues = yup.InferType<typeof schema>;

export const EditRoleDialog = (props: {
  membership: FetchMembershipsQuery["membership"][number] | null;
}) => {
  const [isOpened, setIsOpened] = useAtom(editRoleDialogAtom);
  const [, setPermissionsOpened] = useAtom(permissionsDialogAtom);
  const { teamId } = useParams() as { teamId: string };

  const roles = useMemo(
    () =>
      Object.entries(Role_Enum).map(([key, value]) => ({
        label: key,
        value,
      })),
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
  }, [defaultValues, props.membership, reset]);

  const [editRole] = useEditRoleMutation({
    context: { headers: { team_id: teamId } },
  });

  const onClose = useCallback(() => {
    setIsOpened(false);

    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset, setIsOpened]);

  const submit = useCallback(
    (values: FormValues) => {
      if (!props.membership) {
        return;
      }

      try {
        editRole({
          variables: {
            membershipId: props.membership.id,
            role: values.role.value,
          },

          refetchQueries: [FetchMembershipsDocument],
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
    <Dialog open={isOpened} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="max-w-[580px] grid gap-y-10">
        <div className="grid gap-y-4 justify-items-center">
          <CircleIconContainer variant="info">
            <UserEditIcon />
          </CircleIconContainer>

          <Typography variant={TYPOGRAPHY.H6} className="mt-4">
            Edit role
          </Typography>

          <Notification variant="info">
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
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid gap-y-10 w-full">
          <div className="grid grid-cols-2 gap-x-4">
            <Input
              disabled
              register={register("email")}
              className="py-1 px-2"
            />

            <Controller
              control={control}
              name="role"
              render={({ field }) => {
                return (
                  <div className="relative">
                    <fieldset className="absolute inset-x-0 bottom-0 -top-3 pointer-events-none border rounded-lg">
                      <legend className="ml-3.5 px-0.5">
                        <Typography
                          variant={TYPOGRAPHY.R4}
                          className="text-grey-400"
                        >
                          Role
                        </Typography>
                      </legend>
                    </fieldset>

                    <Select value={field.value} onChange={field.onChange}>
                      <SelectButton className="flex justify-between items-center w-full h-full">
                        <Typography variant={TYPOGRAPHY.R3}>
                          {field.value?.label}
                        </Typography>

                        <CaretIcon />
                      </SelectButton>

                      <SelectOptions className="mt-2">
                        {roles.map((option, index) => (
                          <SelectOption
                            key={`edit-role-option-${index}`}
                            value={option}
                            className="hover:bg-grey-100 transition-colors w-full h-full"
                          >
                            {option.label}
                          </SelectOption>
                        ))}
                      </SelectOptions>
                    </Select>
                  </div>
                );
              }}
            />
          </div>

          <div className="grid grid-cols-2 w-full gap-x-4 items-center">
            <DecoratedButton
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              variant="primary"
              disabled={!isDirty || isSubmitting}
            >
              Change role
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
