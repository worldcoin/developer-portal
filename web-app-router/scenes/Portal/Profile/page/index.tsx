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

const schema = yup.object({
  name: yup.string().required("This is a required field"),
  color: yup.object<Color>({
    "100": yup.string().required(),
    "500": yup.string().required(),
  }),
});

type FormValues = yup.InferType<typeof schema>;

export const ProfilePage = () => {
  const [color, setColor] = useAtom(colorAtom);

  const {
    register,
    control,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      color: color ?? colors["pink"],
      name: "Lisa",
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const selectedColor = useWatch({ control, name: "color" });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    setColor(selectedColor);
  }, [selectedColor, setColor]);

  const submit = useCallback((values: FormValues) => {
    console.log("CLIENT: ", values);
  }, []);

  return (
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
  );
};
