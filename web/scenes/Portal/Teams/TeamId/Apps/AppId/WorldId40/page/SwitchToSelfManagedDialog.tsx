"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Checkbox } from "@/components/Checkbox";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { isAddress } from "ethers";
import * as yup from "yup";
import { useSwitchToSelfManagedMutation } from "./graphql/client/switch-to-self-managed.generated";

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
    getValues,
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
  const [isFocused, setIsFocused] = useState(false);

  // Check if there's any text in the input (even if invalid)
  const hasInputValue = !!managerAddress;
  const [switchToSelfManaged, { loading }] = useSwitchToSelfManagedMutation();

  const handleClose = useCallback(() => {
    if (loading) return;
    reset();
    onClose();
  }, [loading, reset, onClose]);

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
    <Dialog open={open} onClose={handleClose} className="z-50">
      <DialogOverlay />
      <DialogPanel className="grid gap-y-8 md:w-[580px]">
        {/* Custom Red Warning Icon */}
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

        <div className="grid w-full gap-y-4">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-center text-grey-900"
            style={{
              fontSize: "26px",
              lineHeight: "120%",
              letterSpacing: "-0.01em",
            }}
          >
            Do you want to switch
            <br />
            to Self-Managed?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.B3}
            className="text-center text-grey-500"
          >
            After switching, the Developer Portal will no longer submit
            transactions on your behalf. You will be responsible for the key
            management.
            <br />
            This cannot be undone.
          </Typography>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-y-7">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
              New Manager Address
            </Typography>
            <div className="relative">
              <div className="flex h-14 flex-col justify-center rounded-lg bg-grey-50 px-4">
                {(hasInputValue || isFocused) && (
                  <Typography
                    variant={TYPOGRAPHY.B4}
                    className="text-[13px] leading-[130%] text-grey-500"
                  >
                    Ethereum address
                  </Typography>
                )}
                <input
                  {...register("manager_address")}
                  maxLength={42}
                  disabled={loading}
                  placeholder={
                    !isFocused && !hasInputValue
                      ? "Ethereum address"
                      : undefined
                  }
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent font-gta text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 placeholder:opacity-60 focus:outline-none"
                />
              </div>
              {errors.manager_address && (
                <Typography
                  variant={TYPOGRAPHY.B4}
                  className="absolute left-0 top-full pt-2 text-system-error-500"
                >
                  {errors.manager_address.message}
                </Typography>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-x-3">
            <Checkbox register={register("confirmation")} disabled={loading} />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              I understand this cannot be undone
            </Typography>
          </label>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="w-full py-3.5"
            >
              No
            </DecoratedButton>
            <DecoratedButton
              type="submit"
              variant="danger"
              disabled={loading || !isConfirmed || !managerAddress || !isValid}
              className="w-full border-0 bg-danger py-3.5 text-white hover:bg-system-error-700 disabled:border disabled:border-grey-100 disabled:bg-grey-100 disabled:text-grey-300"
            >
              {loading ? "Switching..." : "Yes"}
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
