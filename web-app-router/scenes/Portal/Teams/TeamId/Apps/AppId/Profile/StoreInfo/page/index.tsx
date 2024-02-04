"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AppTopBar } from "../../Components/AppTopBar";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Checkbox } from "@/components/Checkbox";
import { useForm } from "react-hook-form";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { DecoratedButton } from "@/components/DecoratedButton";

const schema = yup.object().shape({
  is_developer_allow_listing: yup.boolean(),
  world_app_description: yup
    .string()
    .max(50, "World app description cannot exceed 50 characters")
    .optional(),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .optional(),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .optional(),
});

export type StoreInfoFormValues = yup.Asserts<typeof schema>;

type AppProfileStoreInfoProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileStoreInfoPage = ({
  params,
}: AppProfileStoreInfoProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<StoreInfoFormValues>({
    resolver: yupResolver(schema),
    // defaultValues: { ...currentApp?.app_metadata, ...description },
  });

  const worldAppDescription = watch("world_app_description");
  const remainingCharacters = 50 - (worldAppDescription?.length || 0);

  return (
    <div className="py-8 gap-y-4 grid">
      <AppTopBar appId={appId} teamId={teamId} />
      <hr className="my-5 w-full text-grey-200 border-dashed" />
      <div className="grid grid-cols-2">
        <form className="grid gap-y-7">
          <Typography variant={TYPOGRAPHY.H7}>Permissions</Typography>
          <div className="grid grid-cols-auto/1fr py-6 px-5 border-[1px] rounded-xl border-grey-200 gap-x-4">
            <Checkbox register={register("is_developer_allow_listing")} />
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                Allow App Store listing
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Once you submit your app for review, it can be placed in
                Worldcoin App Store, if it’s chosen to be displayed by the
                Worldcoin team.
              </Typography>
            </div>
          </div>
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              App description
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Describe your app integration to possible users
            </Typography>
          </div>
          <div className="grid gap-y-5">
            <TextArea
              label="Overview"
              required
              rows={5}
              placeholder="Describe the project for the users who would like to try your integration"
              register={register("description_overview")}
            />
            <TextArea
              label="How it works"
              rows={5}
              placeholder="How do users interact with World ID in your app?"
              register={register("description_how_it_works")}
            />
            <TextArea
              label="How to connect"
              rows={5}
              placeholder="Explain, if required, how users should set up this app to start using World ID."
              register={register("description_connect")}
            />
            <Input
              label="World App Description"
              maxLength={50}
              placeholder="Short description for display in the app"
              register={register("world_app_description")}
              addOnRight={
                <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
                  {remainingCharacters}
                </Typography>
              }
            />
          </div>
          <DecoratedButton type="submit" className="w-40 h-12 ">
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
