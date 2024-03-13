"use client";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { Input } from "@/components/Input";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser, Connection } from "@/lib/types";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { ColorSelector } from "@/scenes/Portal/Profile/page/ColorSelector";
import { useUpdateUserMutation } from "@/scenes/Portal/Profile/page/graphql/client/update-user.generated";
import { Color, colors } from "@/scenes/Portal/Profile/types";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { colorAtom } from "../../layout";
import { AuthMethodDialog, authMethodDialogAtom } from "./AuthMethodDialog";

const schema = yup.object({
  name: yup.string().required("This is a required field"),
  isAllowTracking: yup.boolean(),
  color: yup.object<Color>({
    "100": yup.string().required(),
    "500": yup.string().required(),
  }),
});

type FormValues = yup.InferType<typeof schema>;

export const ProfilePage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { user, loading } = useMeQuery();
  const [, setIsOpened] = useAtom(authMethodDialogAtom);

  const [updateUser] = useUpdateUserMutation({
    refetchQueries: [FetchMeDocument],
  });

  const [color, setColor] = useAtom(colorAtom);

  const connectedAuthMethods = useMemo(() => {
    const methods: Array<Connection> = [];

    if (user.email) {
      methods.push(Connection.Email);
    }

    if (user.world_id_nullifier) {
      methods.push(Connection.Worldcoin);
    }

    return methods;
  }, [user.email, user.world_id_nullifier]);

  const [authModalVariant, setAuthModalVariant] = useState(
    Object.values(Connection).find(
      (c) => c !== connectedAuthMethods[0],
    ) as Connection,
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
    watch,
    resetField,
  } = useForm<FormValues>({
    defaultValues: {
      color: color ?? colors["pink"],
    },

    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!user || loading) {
      return;
    }

    resetField("name", {
      defaultValue: user.nameToDisplay,
    });

    resetField("isAllowTracking", {
      defaultValue: user.is_allow_tracking ?? false,
    });
  }, [loading, resetField, user]);

  const selectedColor = watch("color");
  const name = watch("name");

  useEffect(() => {
    setColor(selectedColor);
  }, [selectedColor, setColor]);

  const submit = useCallback(
    async (values: FormValues) => {
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
              // TODO: pass color
            },
          },
        });

        toast.success("Your profile was successfully updated");
      } catch (error) {
        console.error(error);
        toast.error("Error updating profile");
      }
    },
    [updateUser, auth0User?.hasura],
  );

  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo name={name} />

          <div className="border-b border-dashed border-grey-200" />
        </SizingWrapper>
      </div>

      <SizingWrapper>
        {connectedAuthMethods.length > 0 && (
          <div className="mt-4 grid gap-y-4">
            <Typography as="h2" variant={TYPOGRAPHY.H7}>
              Auth methods
            </Typography>

            <div className="grid gap-4 md:grid-cols-2">
              <Button
                className={clsx(
                  "flex items-center justify-between rounded-12 border p-4",
                  {
                    "cursor-not-allowed border-system-success-500 bg-system-success-100 text-system-success-500":
                      connectedAuthMethods.includes(Connection.Worldcoin),
                    "border-blue-500 bg-blue-100 text-blue-500 transition-colors hover:bg-blue-50":
                      !connectedAuthMethods.includes(Connection.Worldcoin),
                  },
                )}
                type="button"
                onClick={() => {
                  setAuthModalVariant(Connection.Worldcoin);
                  setIsOpened(true);
                }}
                disabled={connectedAuthMethods.includes(Connection.Worldcoin)}
              >
                <Typography variant={TYPOGRAPHY.M3}>
                  Sign in with worldcoin
                </Typography>

                {connectedAuthMethods.includes(Connection.Worldcoin) && (
                  <CheckIcon size="16" className="size-4" />
                )}

                {!connectedAuthMethods.includes(Connection.Worldcoin) && (
                  <ArrowRightIcon className="size-6" />
                )}
              </Button>

              <Button
                className={clsx(
                  "flex w-full items-center justify-between rounded-12 border p-4",
                  {
                    "cursor-not-allowed border-system-success-500 bg-system-success-100 text-system-success-500":
                      connectedAuthMethods.includes(Connection.Email),
                    "border-blue-500 bg-blue-100 text-blue-500 transition-colors hover:bg-blue-50":
                      !connectedAuthMethods.includes(Connection.Email),
                  },
                )}
                type="button"
                onClick={() => {
                  setAuthModalVariant(Connection.Email);
                  setIsOpened(true);
                }}
                disabled={connectedAuthMethods.includes(Connection.Email)}
              >
                <Typography variant={TYPOGRAPHY.M3}>Email</Typography>

                {connectedAuthMethods.includes(Connection.Email) && (
                  <CheckIcon size="16" className="size-4" />
                )}

                {!connectedAuthMethods.includes(Connection.Email) && (
                  <ArrowRightIcon className="size-6" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="m-auto grid gap-y-8 py-8">
          <Typography as="h2" variant={TYPOGRAPHY.H7}>
            Profile settings
          </Typography>

          <form
            className="grid max-w-[36.25rem] gap-y-8"
            onSubmit={handleSubmit(submit)}
          >
            <section className="rounded-12 border border-grey-200 p-6">
              <Typography as="h3" variant={TYPOGRAPHY.R3}>
                Avatar color
              </Typography>

              <Typography
                as="p"
                variant={TYPOGRAPHY.R4}
                className="mb-6 mt-3 max-w-[22.5rem] text-grey-500"
              >
                Assigning colors randomly is the default, but feel free to
                switch them if it`s necessary or preferred
              </Typography>

              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <ColorSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </section>

            <Input
              className="-mt-2"
              label="Display name"
              register={register("name")}
              errors={errors.name}
            />

            <label
              htmlFor="is_allow_tracking"
              className="grid cursor-pointer grid-cols-auto/1fr gap-x-4 rounded-xl border-[1px] border-grey-200 px-5 py-6"
            >
              <Checkbox
                register={register("isAllowTracking")}
                id="is_allow_tracking"
              />

              <div className="grid gap-y-2">
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                  Allow analytics
                </Typography>
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
                  We collect analytics in the developer portal to help us
                  provide a better experience to you.
                </Typography>
              </div>
            </label>
            <div>
              <DecoratedButton
                type="submit"
                variant="primary"
                className="max-h-12 py-4"
                disabled={!isValid || isSubmitting}
              >
                Save changes
              </DecoratedButton>
            </div>
          </form>
        </div>
      </SizingWrapper>

      {connectedAuthMethods.length <= 1 && (
        <AuthMethodDialog variant={authModalVariant} />
      )}
    </>
  );
};
