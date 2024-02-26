"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { ColorSelector } from "@/scenes/Portal/Profile/page/ColorSelector";
import { useUpdateUserMutation } from "@/scenes/Portal/Profile/page/graphql/client/update-user.generated";
import { Color, colors } from "@/scenes/Portal/Profile/types";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { colorAtom } from "../../layout";

const schema = yup.object({
  name: yup.string().required("This is a required field"),
  color: yup.object<Color>({
    "100": yup.string().required(),
    "500": yup.string().required(),
  }),
});

type FormValues = yup.InferType<typeof schema>;

export const ProfilePage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;

  const { user, loading } = useMeQuery({
    context: { headers: { team_id: "_" } },
  });

  const [updateUser] = useUpdateUserMutation({
    context: { headers: { team_id: "_" } },
    refetchQueries: [FetchMeDocument],
  });

  const [color, setColor] = useAtom(colorAtom);

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
        <div className="m-auto grid gap-y-8 py-8">
          <Typography as="h1" variant={TYPOGRAPHY.H7}>
            Profile settings
          </Typography>

          <form
            className="grid max-w-[36.25rem] gap-y-8"
            onSubmit={handleSubmit(submit)}
          >
            <section className="rounded-12 border border-grey-200 p-6">
              <Typography as="h2" variant={TYPOGRAPHY.R3}>
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

            <div>
              <DecoratedButton
                type="submit"
                variant="primary"
                className="py-4"
                disabled={!isValid || isSubmitting}
              >
                Save changes
              </DecoratedButton>
            </div>
          </form>
        </div>
      </SizingWrapper>
    </>
  );
};
