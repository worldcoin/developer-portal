"use client";

import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Switcher } from "@/components/Switch";
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
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
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

export const ProfilePage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { user, loading, error, refetch: refetchMe } = useMeQuery();
  const [hasInitializedProfile, setHasInitializedProfile] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [updateUser] = useMutation(UpdateUserDocument, {
    refetchQueries: [FetchMeDocument],
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { isDirty, isValid, errors, isSubmitting },
    reset,
  } = useForm<DisplayNameFormValues>({
    defaultValues: {
      name: "",
      isAllowTracking: false,
    },
    resolver: yupResolver(displayNameSchema),
    mode: "onChange",
  });

  useEffect(() => {
    // cache-and-network can expose an older cached user while the fresh result
    // is still in flight. Wait for that refresh before establishing the form's
    // defaults so saving one field cannot overwrite a newer value in another.
    // If the refresh failed, the cached record is our explicit degraded mode.
    if (!user?.id || hasInitializedProfile || (loading && !error)) {
      return;
    }

    reset({
      name: user.nameToDisplay,
      isAllowTracking: user.is_allow_tracking ?? false,
    });
    setHasInitializedProfile(true);
  }, [error, hasInitializedProfile, loading, reset, user]);

  const submitProfile = useCallback(
    async (values: DisplayNameFormValues) => {
      if (!auth0User?.hasura) {
        toast.error("Your session is unavailable. Refresh and try again.");
        return;
      }

      try {
        await updateUser({
          variables: {
            user_id: auth0User.hasura.id,
            input: {
              name: values.name,
              is_allow_tracking: values.isAllowTracking,
            },
          },
        });

        reset(values);
        toast.success("Your profile was successfully updated");
      } catch (updateError) {
        console.error("Profile Page: failed to update profile", updateError);
        toast.error("Error updating profile");
      }
    },
    [auth0User?.hasura, reset, updateUser],
  );

  const retryProfile = useCallback(async () => {
    setIsRetrying(true);

    try {
      await refetchMe();
    } catch (refetchError) {
      console.error("Profile Page: failed to reload profile", refetchError);
      toast.error("Error loading profile");
    } finally {
      setIsRetrying(false);
    }
  }, [refetchMe]);

  const hasProfileError =
    !isRetrying && !user?.id && (Boolean(error) || !loading);
  const isProfileLoading =
    !hasProfileError && (isRetrying || !user?.id || !hasInitializedProfile);

  return (
    <>
      <SizingWrapper gridClassName="pb-28">
        <main
          className="w-full max-w-[800px] pt-6"
          aria-busy={isProfileLoading || undefined}
        >
          <h1 className="font-twk text-19 leading-[1.2] font-[550] tracking-[-0.19px] text-portal-ink">
            Profile
          </h1>

          {hasProfileError ? (
            <section className="mt-10 rounded-[10px] border border-portal-border p-4">
              <h2 className="font-world text-15 leading-[1.2] font-[350] text-portal-ink">
                We couldn&apos;t load your profile
              </h2>
              <p className="mt-1 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
                Check your connection and try again.
              </p>
              <InkButton
                type="button"
                className="mt-4 h-8"
                onClick={() => void retryProfile()}
              >
                Try again
              </InkButton>
            </section>
          ) : (
            <div className="mt-10">
              <form onSubmit={handleSubmit(submitProfile)}>
                <div className="grid gap-4">
                  <label
                    htmlFor="profile-display-name"
                    className="font-world text-15 leading-[1.2] font-[350] text-portal-ink"
                  >
                    Display name
                  </label>

                  <div>
                    {isProfileLoading ? (
                      <Skeleton height={40} borderRadius={10} />
                    ) : (
                      <input
                        id="profile-display-name"
                        {...register("name")}
                        maxLength={32}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? "profile-display-name-error" : undefined
                        }
                        className="h-10 w-full rounded-[10px] border border-transparent bg-[#f7f7f7] px-4 font-world text-15 leading-[1.3] font-[350] text-portal-ink outline-hidden transition-colors focus:border-grey-300 focus:bg-white focus:ring-2 focus:ring-grey-100 disabled:cursor-not-allowed disabled:text-portal-subtle"
                      />
                    )}

                    {errors.name?.message ? (
                      <p
                        id="profile-display-name-error"
                        className="mt-2 font-world text-12 leading-[1.3] text-system-error-600"
                      >
                        {errors.name.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex min-h-[69px] items-center justify-between gap-4 rounded-[10px] border border-portal-border px-4 py-4">
                  <div className="min-w-0">
                    <h2 className="font-world text-15 leading-[1.2] font-[350] text-portal-ink">
                      Allow analytics
                    </h2>
                    <p className="mt-0.5 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
                      We collect analytics in the developer portal to help us
                      provide a better experience to you.
                    </p>
                  </div>

                  {isProfileLoading ? (
                    <Skeleton width={40} height={24} borderRadius={999} />
                  ) : (
                    <Controller
                      name="isAllowTracking"
                      control={control}
                      render={({ field }) => (
                        <Switcher
                          enabled={field.value ?? false}
                          setEnabled={field.onChange}
                          disabled={isSubmitting}
                          aria-label="Allow analytics"
                        />
                      )}
                    />
                  )}
                </div>

                {!isProfileLoading && isDirty ? (
                  <div className="mt-4 flex justify-end">
                    <InkButton
                      type="submit"
                      className="h-8"
                      loading={isSubmitting}
                      disabled={!isValid}
                    >
                      Save
                    </InkButton>
                  </div>
                ) : null}
              </form>

              {!isProfileLoading && user?.id ? (
                <WorldIdAccountMigration
                  auth0User={auth0User}
                  isLinked={Boolean(user.world_id_nullifier)}
                  onLinkSuccess={refetchMe}
                />
              ) : null}

              <hr className="my-10 border-0 border-t border-portal-border" />

              <List
                memberships={user?.memberships}
                loading={isProfileLoading}
              />

              <hr className="my-10 border-0 border-t border-portal-border" />

              <section aria-labelledby="profile-danger-zone-heading">
                <h2
                  id="profile-danger-zone-heading"
                  className="font-twk text-17 leading-5 font-[550] tracking-[-0.17px] text-portal-ink"
                >
                  Danger zone
                </h2>

                <div className="mt-4 flex min-h-[71px] flex-col gap-4 rounded-[10px] border border-portal-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-world text-15 leading-[1.2] font-[350] text-portal-ink">
                      Delete account
                    </h3>
                    <p className="mt-1 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
                      Permanently delete this account and all of its apps.
                    </p>
                  </div>

                  <DestructiveTriggerButton
                    disabled={isProfileLoading}
                    onClick={() => setIsDeleteAccountOpen(true)}
                  >
                    Delete account
                  </DestructiveTriggerButton>
                </div>
              </section>
            </div>
          )}
        </main>
      </SizingWrapper>

      <DeleteAccountDialog
        open={isDeleteAccountOpen}
        onClose={setIsDeleteAccountOpen}
      />
    </>
  );
};
