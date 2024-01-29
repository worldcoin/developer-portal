"use client";
import { UserInfo } from "@/scenes/Portal/Profile/layout/UserInfo";
import { ColorSelector } from "@/scenes/Portal/Profile/page/ColorSelector";
import { ColorName } from "@/scenes/Portal/Profile/types";
import { Input } from "@/components/Input";
import { useForm, useWatch, Controller } from "react-hook-form";
import { DecoratedButton } from "@/components/DecoratedButton";

export const ProfilePage = () => {
  const { register, control, handleSubmit } = useForm<{
    color: ColorName;
    name: string;
  }>({
    defaultValues: {
      color: "pink",
      name: "Lisa",
    },
  });

  const color = useWatch({ control, name: "color" });
  const name = useWatch({ control, name: "name" });

  return (
    <div className="grid gap-y-8 max-w-[1180px] m-auto py-8">
      <UserInfo color={color} name={name} email="lisa@toolsforhumanity.org" />

      <div className="border-b border-grey-200 border-dashed" />

      <h1 className="leading-6 font-550 text-18">Profile settings</h1>

      <form
        className="grid gap-y-8 max-w-[36.25rem]"
        onSubmit={handleSubmit(() => {})}
      >
        <section className="p-6 border border-grey-200 rounded-12">
          <h2 className="leading-6 text-16">Avatar color</h2>

          <p className="max-w-[22.5rem] mt-3 mb-6 leading-5 text-14 text-grey-500">
            Assigning colors randomly is the default, but feel free to switch
            them if it's necessary or preferred
          </p>

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
        />

        <div>
          <DecoratedButton type="submit" variant="primary">
            Save changes
          </DecoratedButton>
        </div>
      </form>
    </div>
  );
};
