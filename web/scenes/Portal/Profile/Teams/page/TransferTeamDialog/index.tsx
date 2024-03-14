import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { Notification } from "@/components/Notification";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { getNullifierName } from "@/lib/utils";
import {
  FetchMeDocument,
  FetchMeQuery,
} from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import {
  FetchMembersQuery,
  useFetchMembersQuery,
} from "./graphql/client/fetch-members.generated";
import { useFetchUserMembershipQuery } from "./graphql/client/fetch-user-membership.generated";
import { useTransferOwnershipMutation } from "./graphql/client/transfer-ownership.generated";

type TransferTeamDialogProps = DialogProps & {
  team?: NonNullable<FetchMeQuery["user_by_pk"]>["memberships"][0]["team"];
};

type FormValues = {
  member: FetchMembersQuery["members"][0] | undefined;
};

export const TransferTeamDialog = (props: TransferTeamDialogProps) => {
  const { team, ...otherProps } = props;
  const { user } = useUser() as Auth0SessionUser;

  const { data } = useFetchMembersQuery({
    variables:
      !team || !user?.hasura
        ? undefined
        : {
            user_id: user?.hasura.id,
            team_id: team.id,
          },

    skip: !team || !user?.hasura,
  });

  const getName = useCallback((member?: FetchMembersQuery["members"][0]) => {
    return (
      member?.user.name ||
      member?.user?.email ||
      getNullifierName(member?.user?.world_id_nullifier) ||
      "Anonymous User"
    );
  }, []);

  const [transferMembership] = useTransferOwnershipMutation();

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { member: undefined },
  });

  const member = useWatch({ control, name: "member" });

  const { data: userMembership } = useFetchUserMembershipQuery({
    variables: {
      user_id: user?.hasura.id ?? "",
      team_id: team?.id ?? "",
    },
  });

  const userMembershipId = userMembership?.members[0]?.id;

  const submit = useCallback(
    async (values: FormValues) => {
      if (!user?.hasura || !values.member || !userMembershipId) return;

      try {
        await transferMembership({
          variables: {
            id: values.member.id,
            user_member_id: userMembershipId,
          },
          refetchQueries: [FetchMeDocument],
        });

        toast.success("Ownership transferred!");
        props.onClose(true);
      } catch (e) {
        console.error(e);
        toast.error("Error ownership transferring");
      }
    },
    [props, transferMembership, user?.hasura, userMembershipId],
  );

  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[32rem]">
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
              <span className="font-medium">
                {member.user.name} ({member.user.email})
              </span>{" "}
              the owner of <span className="font-medium">{team?.name}</span>?
              You can`t undo this action.
            </span>
          </Notification>
        )}

        <form
          className="mt-2 grid w-full gap-y-10"
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
                  value={field.value ?? null}
                  onChange={field.onChange}
                >
                  <SelectButton className="relative grid w-full grid-cols-1fr/auto items-center py-3 text-start">
                    <Typography variant={TYPOGRAPHY.R3}>
                      {!field.value ? (
                        <span className="text-gray-400">
                          Select team member
                        </span>
                      ) : (
                        <span>
                          {getName(member)}{" "}
                          {member?.user.email && `(${member?.user.email})`}
                        </span>
                      )}
                    </Typography>

                    <fieldset className="pointer-events-none absolute inset-x-0 bottom-0 top-[-12px] rounded-lg border border-grey-200">
                      <legend className="ml-4 px-0.5 text-grey-400">
                        <Typography variant={TYPOGRAPHY.R4}>User</Typography>
                      </legend>
                    </fieldset>

                    <CaretIcon />
                  </SelectButton>

                  <SelectOptions className="mt-2">
                    {data?.members.map((member) => (
                      <SelectOption
                        key={member.id}
                        className="transition hover:bg-grey-100"
                        value={member}
                      >
                        {getName(member)}{" "}
                        {member.user.email && `(${member.user.email})`}
                      </SelectOption>
                    ))}
                  </SelectOptions>
                </Select>
              );
            }}
          />

          <div className="mt-2 grid w-full gap-4 md:grid-cols-2">
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

