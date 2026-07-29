"use client";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { SizingWrapper } from "@/components/SizingWrapper";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { DeleteAccountDialog } from "@/scenes/PortalV3/Profile/DangerZone/DeleteAccountDialog";
import { List } from "@/scenes/PortalV3/Profile/Teams/page/List";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { ColorSelector } from "@/scenes/PortalV3/Profile/page/ColorSelector";
import { CreateTeamDialog } from "@/scenes/PortalV3/Profile/page/CreateTeamDialog";
import { WorldIdAccountMigration } from "@/scenes/common/Profile/page/WorldIdAccountMigration";
import { UpdateUserDocument } from "@/scenes/common/Profile/page/graphql/client/update-user.generated";
import {
  Color,
  ColorName,
  colors,
  getColorByName,
  getColorName,
} from "@/scenes/common/Profile/types";
import { colorAtom } from "@/scenes/common/layout/color-atom";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation } from "@apollo/client/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import {
  CSSProperties,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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

const avatarSchema = yup
  .object({
    color: yup
      .mixed<ColorName>()
      .oneOf(Object.keys(colors) as ColorName[])
      .required(),
  })
  .noUnknown();

type DisplayNameFormValues = yup.InferType<typeof displayNameSchema>;
type AvatarFormValues = yup.InferType<typeof avatarSchema>;

const CardHeader = (props: {
  title: string;
  description?: string;
  danger?: boolean;
}) => (
  <header className="px-5 py-5 md:px-6">
    <h2
      className={`font-twk text-17 leading-5 font-[550] ${
        props.danger ? "text-system-error-600" : "text-portal-text"
      }`}
    >
      {props.title}
    </h2>
    {props.description ? (
      <p className="mt-1.5 font-gta text-13 leading-5 text-grey-400">
        {props.description}
      </p>
    ) : null}
  </header>
);

const CardFooter = (props: { children: ReactNode }) => (
  <footer className="flex min-h-14 flex-col gap-3 border-t border-grey-100 bg-grey-25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
    {props.children}
  </footer>
);

const AvatarPreview = (props: { color: Color; name: string }) => (
  <div
    className="flex size-16 shrink-0 items-center justify-center rounded-full font-world text-24 font-medium uppercase"
    style={
      {
        backgroundColor: props.color[100],
        color: props.color[500],
      } as CSSProperties
    }
    aria-label="Avatar preview"
  >
    {props.name.trim()[0] ?? "A"}
  </div>
);

export const ProfilePage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { user, loading, refetch: refetchMe } = useMeQuery();
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const [updateUser] = useMutation(UpdateUserDocument, {
    refetchQueries: [FetchMeDocument],
  });

  const [color, setColor] = useAtom(colorAtom);
  const hasInitializedDisplayName = useRef(false);
  const hasInitializedAvatar = useRef(false);

  const {
    register: registerDisplayName,
    control: displayNameControl,
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

  const {
    control: avatarControl,
    handleSubmit: handleAvatarSubmit,
    formState: {
      isDirty: isAvatarDirty,
      isValid: isAvatarValid,
      isSubmitting: isAvatarSubmitting,
    },
    reset: resetAvatar,
  } = useForm<AvatarFormValues>({
    defaultValues: {
      color: getColorName(color) ?? "pink",
    },
    resolver: yupResolver(avatarSchema),
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

  useEffect(() => {
    if (!user || loading || hasInitializedAvatar.current) {
      return;
    }

    const initialColor =
      getColorByName(user.avatar_color) ??
      color ??
      calculateColorFromString(user.nameToDisplay) ??
      colors.pink;
    const initialColorName = getColorName(initialColor) ?? "pink";

    resetAvatar({ color: initialColorName });
    setColor(initialColor);
    hasInitializedAvatar.current = true;
  }, [color, loading, resetAvatar, setColor, user]);

  const selectedColor = useWatch({
    control: avatarControl,
    name: "color",
  });
  const displayName = useWatch({
    control: displayNameControl,
    name: "name",
  });

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

  const submitAvatar = useCallback(
    async (values: AvatarFormValues) => {
      if (!auth0User?.hasura) {
        return;
      }

      try {
        await updateUser({
          variables: {
            user_id: auth0User.hasura.id,
            input: {
              avatar_color: values.color,
            },
          },
        });

        resetAvatar(values);
        toast.success("Your profile was successfully updated");
      } catch (error) {
        console.error("Profile Page: ", error);
        toast.error("Error updating profile");
      }
    },
    [auth0User?.hasura, resetAvatar, updateUser],
  );

  const nameForAvatar = displayName || user?.nameToDisplay || "Account";

  return (
    <>
      <SizingWrapper gridClassName="py-8 md:py-12">
        <div className="mx-auto w-full max-w-[760px]">
          <header className="mb-8">
            <h1 className="font-twk text-24 leading-[1.2] font-[550] text-portal-heading">
              Profile
            </h1>
            <p className="mt-2 font-gta text-13 leading-5 text-grey-400">
              Manage your teams, display name, avatar, and account.
            </p>
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
              <CardHeader
                title="Display name"
                description="Shown across your teams and apps."
              />

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

            <form
              className="overflow-hidden rounded-12 border border-grey-200 bg-white"
              onSubmit={handleAvatarSubmit(submitAvatar)}
            >
              <CardHeader
                title="Avatar"
                description="Colors are assigned randomly — pick the one that feels like you."
              />

              <div className="flex flex-col gap-8 border-t border-grey-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <Controller
                  name="color"
                  control={avatarControl}
                  render={({ field }) => (
                    <ColorSelector
                      value={field.value}
                      name={nameForAvatar}
                      onChange={(nextColorName) => {
                        field.onChange(nextColorName);
                        setColor(colors[nextColorName]);
                      }}
                    />
                  )}
                />

                <AvatarPreview
                  color={colors[selectedColor ?? "pink"]}
                  name={nameForAvatar}
                />
              </div>

              <CardFooter>
                <InkButton
                  type="submit"
                  className="h-8 self-end sm:ml-auto"
                  disabled={
                    !isAvatarDirty ||
                    !isAvatarValid ||
                    isAvatarSubmitting ||
                    loading
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

            <section className="overflow-hidden rounded-12 border border-system-error-300 bg-white">
              <CardHeader
                title="Delete account"
                description="Permanently removes your account and all team memberships. This action is not reversible."
                danger
              />

              <footer className="flex min-h-14 items-center justify-end border-t border-system-error-200 bg-system-error-50 px-5 py-3 md:px-6">
                <Button
                  type="button"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="inline-flex h-8 cursor-pointer items-center justify-center rounded-8 bg-system-error-600 px-4 font-world text-13 leading-none font-medium text-white outline-hidden transition-colors hover:bg-system-error-800 focus-visible:ring-2 focus-visible:ring-system-error-300 focus-visible:ring-offset-2"
                >
                  Delete account
                </Button>
              </footer>
            </section>
          </div>
        </div>
      </SizingWrapper>

      <DeleteAccountDialog
        open={isDeleteAccountOpen}
        onClose={setIsDeleteAccountOpen}
      />

      <Suspense fallback={null}>
        <CreateTeamDialog />
      </Suspense>
    </>
  );
};
