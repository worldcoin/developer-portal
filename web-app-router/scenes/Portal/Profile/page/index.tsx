"use client";

import { ColorSelector } from "@/scenes/Portal/Profile/page/ColorSelector";
import { Color, ColorName, colors } from "@/scenes/Portal/Profile/types";
import { Input } from "@/components/Input";
import { useForm, useWatch, Controller } from "react-hook-form";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect } from "react";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtom } from "jotai";
import { colorAtom } from "../../layout";
import { useUser } from '@auth0/nextjs-auth0/client'
import { FetchUserDocument, useFetchUserQuery } from "@/scenes/Portal/Profile/common/graphql/client/fetch-user.generated";
import { useUpdateUserMutation } from "@/scenes/Portal/Profile/page/graphql/client/update-user.generated";
import { toast } from "react-toastify";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { Auth0SessionUser } from "@/lib/types";

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

  const { data } = useFetchUserQuery({
    context: { headers: { team_id: '_' } },
    variables: user?.hasura ? { user_id: user?.hasura.id } : undefined,
    skip: !user?.hasura
  })

  const [updateUser] = useUpdateUserMutation({
    context: { headers: { team_id: '_' } },
  })

  const [color, setColor] = useAtom(colorAtom);

  const {
    register,
    control,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    values: {
      color: color ?? colors["pink"],
      name: data?.user?.name ?? '',
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const selectedColor = useWatch({ control, name: "color" });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    setColor(selectedColor);
  }, [selectedColor, setColor]);

  const submit = useCallback(async (values: FormValues) => {
    if (!user?.hasura) return;
    try {
      await updateUser({
        variables: {
          user_id: user?.hasura.id,
          input: {
            name: values.name,
            //color: values.color,
          },
        },
        refetchQueries: [
          FetchUserDocument,
        ]
      })
      toast.success("Profile saved!");
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile");
    }
  }, [updateUser, user?.hasura?.id]);

  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo name={name}/>

          <div className="border-b border-grey-200 border-dashed" />
        </SizingWrapper>
      </div>

      <SizingWrapper>
        <div className="grid gap-y-8 m-auto py-8">
          <Typography as="h1" variant={TYPOGRAPHY.H7}>
            Profile settings
          </Typography>

          <form
            className="grid gap-y-8 max-w-[36.25rem]"
            onSubmit={handleSubmit(submit)}
          >
            <section className="p-6 border border-grey-200 rounded-12">
              <Typography as="h2" variant={TYPOGRAPHY.R3}>
                Avatar color
              </Typography>

              <Typography
                as="p"
                variant={TYPOGRAPHY.R4}
                className="max-w-[22.5rem] mt-3 mb-6 text-grey-500"
              >
                Assigning colors randomly is the default, but feel free to switch
                them if it`s necessary or preferred
              </Typography>

              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <ColorSelector value={field.value} onChange={field.onChange} />
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
