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
import { Controller, useForm, useWatch } from "react-hook-form";
import { useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { FetchMembersQuery, useFetchMembersQuery } from "./graphql/client/fetch-members.generated";
import { FetchMembershipsDocument, FetchMembershipsQuery } from "../graphql/client/fetch-memberships.generated";
import { useTransferOwnershipMutation } from "./graphql/client/transfer-ownership.generated";
import { toast } from "react-toastify";
import { Auth0SessionUser } from "@/lib/types";

type TransferTeamDialogProps = DialogProps & {
  team?: FetchMembershipsQuery["memberships"][0]["team"];
};

type FormValues =  {
  member: FetchMembersQuery["members"][0];
};

export const TransferTeamDialog = (props: TransferTeamDialogProps) => {
  const { team, ...otherProps } = props;

  const { user } = useUser() as Auth0SessionUser;

  const membersQueryRes = useFetchMembersQuery({
    context: { headers: { team_id: team?.id } },
    variables: !team || !user?.hasura ? undefined : {
      user_id: user?.hasura.id,
      team_id: team.id,
    },
    skip: !team || !user?.hasura,
  })

  const [transferMembership] = useTransferOwnershipMutation({
    context: { headers: { team_id: team?.id } },
  })

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
  });

  const member = useWatch({ control, name: "member" });

  const submit = useCallback(async (values: FormValues) => {
    if (!user?.hasura) return;
    try {
      await transferMembership({
        variables: {
          id: values.member.id,
          user_id: user?.hasura.id,
        },
        refetchQueries: [
          FetchMembershipsDocument
        ]
      })
      toast.success("Ownership transferred!");
      props.onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("Error ownership transferring");
    }
  }, [props, transferMembership, user?.hasura]);

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

        {member && (
          <Notification variant="warning">
            <span className="font-gta">
              Are you sure you want to make{" "}
              <span className="font-medium">{member.user.name} ({member.user.email})</span> the owner of{" "}
              <span className="font-medium">{team?.name}</span>? You can`t
              undo this action.
            </span>
          </Notification>
        )}

        <form
          className="w-full grid gap-y-10 mt-2"
          onSubmit={handleSubmit(submit)}
        >
          <Controller
            name="member"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              return (
                <Select
                  by={(a, b) => a?.id === b?.id}
                  value={field.value}
                  onChange={field.onChange}
                >
                  <SelectButton className="w-full grid grid-cols-1fr/auto items-center text-start relative py-3">
                    <Typography variant={TYPOGRAPHY.R3}>
                      {!field.value ? (
                        <span className="text-gray-400">Select team member</span>
                      ) : (
                        <span>
                          {field.value.user.name} ({field.value.user.email})
                        </span>
                      )}
                    </Typography>

                    <fieldset className="absolute inset-x-0 bottom-0 top-[-12px] border border-grey-200 rounded-lg pointer-events-none">
                      <legend className="text-grey-400 ml-4 px-0.5">
                        <Typography variant={TYPOGRAPHY.R4}>User</Typography>
                      </legend>
                    </fieldset>

                    <CaretIcon />
                  </SelectButton>

                  <SelectOptions className="mt-2">
                    {membersQueryRes.data?.members.map((member, i) => (
                      <SelectOption
                        key={member.id}
                        className="hover:bg-grey-100 transition"
                        value={member}
                      >
                        {member.user.name} ({member.user.email})
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
              disabled={isSubmitting}
            >
              Cancel
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
            >
              Transfer ownership
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
