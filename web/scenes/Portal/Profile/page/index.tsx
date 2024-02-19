"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { getNullifierName } from "@/lib/utils";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import {
  FetchUserDocument,
  useFetchUserQuery,
} from "@/scenes/Portal/Profile/common/graphql/client/fetch-user.generated";
import { ColorSelector } from "@/scenes/Portal/Profile/page/ColorSelector";
import { useUpdateUserMutation } from "@/scenes/Portal/Profile/page/graphql/client/update-user.generated";
import { Color, colors } from "@/scenes/Portal/Profile/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  const { user } = useUser() as Auth0SessionUser;

  const { data, loading } = useFetchUserQuery({
    context: { headers: { team_id: "_" } },
    variables: user?.hasura ? { user_id: user?.hasura.id } : undefined,
    skip: !user?.hasura,
  });

  const [updateUser] = useUpdateUserMutation({
    context: { headers: { team_id: "_" } },
  });

  const [color, setColor] = useAtom(colorAtom);

  const {
    register,
    control,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },

    resetField,
  } = useForm<FormValues>({
    defaultValues: {
      color: color ?? colors["pink"],
    },

    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!data || loading) {
      return;
    }

    resetField("name", {
      defaultValue:
        data?.user?.name ||
        data?.user?.email ||
        getNullifierName(data?.user?.world_id_nullifier) ||
        "Anonymous User",
    });
  }, [data, loading, resetField]);

  const selectedColor = useWatch({ control, name: "color" });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    setColor(selectedColor);
  }, [selectedColor, setColor]);

  const submit = useCallback(
    async (values: FormValues) => {
      if (!user?.hasura) {
        return;
      }

      try {
        await updateUser({
          variables: {
            user_id: user?.hasura.id,
            input: {
              name: values.name,
              // TODO: pass color
            },
          },
          refetchQueries: [FetchUserDocument],
        });

        toast.success("Your profile was successfully updated");
      } catch (error) {
        console.error(error);
        toast.error("Error updating profile");
      }
    },
    [updateUser, user?.hasura],
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
