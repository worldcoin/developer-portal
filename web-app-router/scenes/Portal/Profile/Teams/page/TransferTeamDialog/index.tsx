import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Notification } from "@/components/Notification";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback } from "react";

type TransferTeamDialogProps = DialogProps & {
  email: string;
  teamName: string;
};

const schema = yup.object({
  user: yup.string().required("This field is required"),
});

type FormValues = yup.InferType<typeof schema>;

export const TransferTeamDialog = (props: TransferTeamDialogProps) => {
  const { ...otherProps } = props;

  const members = [
    "qwer@qwer.qwer",
    "qwer1@qwer.qwer",
    "qwer2@qwer.qwer",
    "qwer3@qwer.qwer",
  ];

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      user: members[0],
    },
  });

  const submit = useCallback((values: FormValues) => {
    console.log({ values });
  }, []);

  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[36.25rem] grid gap-y-8">
        <CircleIconContainer variant="info">
          <ExchangeIcon />
        </CircleIconContainer>

        <Typography as="h3" variant={TYPOGRAPHY.H6}>
          Transfer ownership
        </Typography>

        <Notification variant="warning">
          <span className="font-gta">
            Are you sure you want to make{" "}
            <span className="font-medium">{props.email}</span> the owner of{" "}
            <span className="font-medium">{props.teamName}</span>? You can`t
            undo this action.
          </span>
        </Notification>

        <form
          className="w-full grid gap-y-10 mt-2"
          onSubmit={handleSubmit(submit)}
        >
          <Controller
            name="user"
            control={control}
            render={({ field }) => {
              return (
                <Select onChange={field.onChange}>
                  <SelectButton className="w-full grid grid-cols-1fr/auto items-center text-start relative py-3">
                    <Typography variant={TYPOGRAPHY.R3}>
                      {field.value}
                    </Typography>

                    <fieldset className="absolute inset-x-0 bottom-0 top-[-12px] border border-grey-200 rounded-lg pointer-events-none">
                      <legend className="text-grey-400 ml-4 px-0.5">
                        <Typography variant={TYPOGRAPHY.R4}>User</Typography>
                      </legend>
                    </fieldset>

                    <CaretIcon />
                  </SelectButton>

                  <SelectOptions className="mt-2">
                    {members
                      .filter((m) => m !== field.value)
                      .map((member, i) => (
                        <SelectOption
                          key={`${member}-${i}`}
                          className="hover:bg-grey-100 transition"
                          value={member}
                        >
                          {member}
                        </SelectOption>
                      ))}
                  </SelectOptions>
                </Select>
              );
            }}
          />

          <div className="grid grid-cols-2 w-full gap-x-4 mt-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={() => props.onClose(false)}
            >
              Cancel
            </DecoratedButton>

            <DecoratedButton type="submit" variant="primary">
              Transfer ownership
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
