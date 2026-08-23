"use client";

import { useCallback } from "react";
import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { Checkbox } from "@/components/Checkbox";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { isAddress } from "ethers";
import * as yup from "yup";
import { useMutation } from "@apollo/client/react";
import { SwitchToSelfManagedDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/client/switch-to-self-managed.generated";

type Props = {
  open: boolean;
  onClose: () => void;
  appId: string;
  onSuccess?: () => void;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const schema = yup
  .object({
    manager_address: yup
      .string()
      .required("Manager address is required")
      .transform((value) => {
        if (!value) return value;
        return value.startsWith("0x") ? value : `0x${value}`;
      })
      .test(
        "is-address",
        "Invalid address. Must be 40 hex characters (0x followed by 40 characters)",
        (value) => !value || isAddress(value),
      )
      .test(
        "not-zero",
        "Cannot use zero address",
        (value) => !value || value !== ZERO_ADDRESS,
      ),
    confirmation: yup
      .boolean()
      .required()
      .oneOf([true], "You must confirm to proceed"),
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

export const SwitchToSelfManagedDialog = (props: Props) => {
  const { open, onClose, appId, onSuccess } = props;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      manager_address: "",
      confirmation: false,
    },
  });

  const isConfirmed = watch("confirmation");
  const managerAddress = watch("manager_address");
  const [switchToSelfManaged, { loading }] = useMutation(
    SwitchToSelfManagedDocument,
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const afterLeave = useCallback(() => {
    reset();
  }, [reset]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!values.manager_address) {
        return;
      }

      try {
        const { data } = await switchToSelfManaged({
          variables: {
            app_id: appId,
            new_manager_address: values.manager_address,
          },
        });

        if (!data?.switch_to_self_managed?.rp_id) {
          throw new Error("Invalid response from server");
        }

        toast.success(
          "Switching to self-managed mode. This may take a few minutes.",
        );
        onSuccess?.();
        handleClose();
      } catch (error) {
        toast.error("Failed to switch mode. Please try again.");
      }
    },
    [appId, switchToSelfManaged, onSuccess, handleClose],
  );

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      afterLeave={afterLeave}
      dismissable={!loading}
      title="Switch to self-managed"
      closeLabel="Close switch to self-managed dialog"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-y-6">
        <div className="grid justify-items-center gap-y-4">
          {/* Preserve the flow's existing warning icon inside the new dialog. */}
          <div className="relative size-22 shrink-0">
            <div className="absolute inset-0 rounded-full bg-danger" />
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 22.73% 0%, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "0.5px",
              }}
            />
            <div
              className="absolute text-grey-0"
              style={{
                left: "22.16%",
                right: "23.3%",
                top: "22.16%",
                bottom: "23.3%",
              }}
            >
              <AlertIcon className="size-full" />
            </div>
          </div>

          <Typography
            variant={TYPOGRAPHY.B3}
            className="text-center text-portal-muted"
          >
            After switching, the Developer Portal will no longer submit
            transactions on your behalf. You will be responsible for the key
            management.
            <br />
            This cannot be undone.
          </Typography>
        </div>

        <div>
          <label
            htmlFor="self-managed-manager-address"
            className={formDialogLabelClassName}
          >
            New manager address
          </label>
          <input
            id="self-managed-manager-address"
            {...register("manager_address")}
            maxLength={42}
            disabled={loading}
            placeholder="Ethereum address"
            className={formDialogInputClassName}
            aria-invalid={Boolean(errors.manager_address)}
            aria-describedby={
              errors.manager_address
                ? "self-managed-manager-address-error"
                : undefined
            }
          />
          {errors.manager_address?.message ? (
            <p
              id="self-managed-manager-address-error"
              className={formDialogErrorClassName}
            >
              {errors.manager_address.message}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-x-3">
          <Checkbox register={register("confirmation")} disabled={loading} />
          <Typography variant={TYPOGRAPHY.R4} className="text-portal-muted">
            I understand this cannot be undone
          </Typography>
        </label>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={formDialogSecondaryActionClassName}
          >
            No
          </button>
          <button
            type="submit"
            disabled={loading || !isConfirmed || !managerAddress || !isValid}
            className={formDialogDangerActionClassName}
          >
            {loading ? "Switching..." : "Yes"}
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
