"use client";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Auth0SessionUser } from "@/lib/types";
import { DeleteAccountDialog } from "@/scenes/PortalV3/Profile/DangerZone/DeleteAccountDialog";
import { List } from "@/scenes/PortalV3/Profile/Teams/page/List";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { WorldIdAccountMigration } from "@/scenes/common/Profile/page/WorldIdAccountMigration";
import { UpdateUserDocument } from "@/scenes/common/Profile/page/graphql/client/update-user.generated";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation } from "@apollo/client/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

const displayNameSchema = yup
  .object({
    name: yup
      .string()
      .required("This is a required field")
      .max(32, "Please use 32 characters at maximum."),
    isAllowTracking: yup.boolean(),
  })
  .noUnknown();

type DisplayNameFormValues = yup.InferType<typeof displayNameSchema>;

const CardHeader = (props: { title: string }) => (
  <header className="px-5 py-5 md:px-6">
    <h2 className="font-twk text-17 leading-5 font-[550] text-portal-text">
      {props.title}
    </h2>
  </header>
);

const CardFooter = (props: { children: ReactNode }) => (
  <footer className="flex min-h-14 flex-col gap-3 border-t border-grey-100 bg-grey-25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
    {props.children}
  </footer>
);

export const ProfilePage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { user, loading, refetch: refetchMe } = useMeQuery();
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const [updateUser] = useMutation(UpdateUserDocument, {
    refetchQueries: [FetchMeDocument],
  });

  const hasInitializedDisplayName = useRef(false);

  const {
    register: registerDisplayName,
    handleSubmit: handleDisplayNameSubmit,
    formState: {
      isDirty: isDisplayNameDirty,
      isValid: isDisplayNameValid,
      errors: displayNameErrors,
      isSubmitting: isDisplayNameSubmitting,
    },
    reset: resetDisplayName,
  } = useForm<DisplayNameFormValues>({
    defaultValues: {
      name: "",
      isAllowTracking: false,
    },
    resolver: yupResolver(displayNameSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!user || loading || hasInitializedDisplayName.current) {
      return;
    }

    resetDisplayName({
      name: user.nameToDisplay,
      isAllowTracking: user.is_allow_tracking ?? false,
    });
    hasInitializedDisplayName.current = true;
  }, [loading, resetDisplayName, user]);

  const submitDisplayName = useCallback(
    async (values: DisplayNameFormValues) => {
      if (!auth0User?.hasura) {
        return;
      }

      try {
        await updateUser({
          variables: {
            user_id: auth0User?.hasura.id,
            input: {
              name: values.name,
              is_allow_tracking: values.isAllowTracking,
            },
          },
        });

        resetDisplayName(values);
        toast.success("Your profile was successfully updated");
      } catch (error) {
        console.error("Profile Page: ", error);
        toast.error("Error updating profile");
      }
    },
    [auth0User?.hasura, resetDisplayName, updateUser],
  );

  return (
    <>
      <SizingWrapper gridClassName="py-8 md:py-12">
        <div className="mx-auto w-full max-w-[760px]">
          <header className="mb-6">
            <h1 className="font-twk text-24 leading-[1.2] font-[550] text-portal-heading">
              Profile
            </h1>
          </header>

          <div className="grid gap-6">
            <section className="overflow-hidden rounded-12 border border-grey-200 bg-white">
              <CardHeader title="Teams" />
              <List memberships={user?.memberships} loading={loading} />
            </section>

            <form
              className="overflow-hidden rounded-12 border border-grey-200 bg-white"
              onSubmit={handleDisplayNameSubmit(submitDisplayName)}
            >
              <CardHeader title="Display name" />

              <div className="border-t border-grey-100 px-5 py-5 md:px-6">
                <div className="max-w-[380px]">
                  <Input
                    label="Display name"
                    register={registerDisplayName("name")}
                    errors={displayNameErrors.name}
                    maxLength={32}
                  />
                </div>

                <label
                  htmlFor="is_allow_tracking"
                  className="mt-6 flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    register={registerDisplayName("isAllowTracking")}
                    id="is_allow_tracking"
                    className="mt-0.5 shrink-0"
                  />

                  <span className="grid gap-1">
                    <span className="font-world text-13 leading-5 font-medium text-grey-700">
                      Allow analytics
                    </span>
                    <span className="font-gta text-13 leading-5 text-grey-400">
                      We collect analytics in the developer portal to help us
                      provide a better experience to you.
                    </span>
                  </span>
                </label>
              </div>

              <CardFooter>
                <p className="font-gta text-13 leading-5 text-grey-400">
                  Please use 32 characters at maximum.
                </p>
                <InkButton
                  type="submit"
                  className="h-8"
                  disabled={
                    !isDisplayNameDirty ||
                    !isDisplayNameValid ||
                    isDisplayNameSubmitting
                  }
                >
                  Save
                </InkButton>
              </CardFooter>
            </form>

            <WorldIdAccountMigration
              auth0User={auth0User}
              isLinked={Boolean(user?.world_id_nullifier)}
              onLinkSuccess={refetchMe}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setIsDeleteAccountOpen(true)}
                className="inline-flex h-8 items-center justify-center rounded-8 border border-system-error-300 bg-white px-4 font-world text-13 leading-none font-medium text-system-error-600 outline-hidden transition-colors hover:border-system-error-400 hover:bg-system-error-50 focus-visible:ring-2 focus-visible:ring-system-error-300 focus-visible:ring-offset-2"
              >
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </SizingWrapper>

      <DeleteAccountDialog
        open={isDeleteAccountOpen}
        onClose={setIsDeleteAccountOpen}
      />
    </>
  );
};
