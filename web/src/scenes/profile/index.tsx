import { Layout } from "@/components/Layout";
import { memo, useCallback } from "react";
import { Preloader } from "@/components/Preloader";
import { Icon } from "@/components/Icon";
import { useToggle } from "@/hooks/useToggle";
import { FieldInput } from "@/components/FieldInput2";
import { useUpdateUser } from "./hooks/user-hooks";
import Link from "next/link";
import { Button } from "@/components/Button2";
import { Checkbox } from "@/components/Checkbox";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useFetchUser } from "@/components/Layout/LoggedUserDisplay/hooks/user-hooks";
import { DeleteAccountDialog } from "@/scenes/profile/DeleteAccountDialog";

const userDataSchema = yup.object({
  name: yup.string().required("This field is required"),
  imageUrl: yup.string(),
});

type UserDataForm = yup.InferType<typeof userDataSchema>;

export const Profile = memo(function Profile() {
  const { user } = useFetchUser();
  const [updateUser] = useUpdateUser(user?.hasura.id ?? "");

  const { control, register, reset, handleSubmit, formState } =
    useForm<UserDataForm>({
      values: {
        name: user?.hasura.name ?? "",
        //FIXME: add user image field to hasura
        imageUrl: "",
      },

      resolver: yupResolver(userDataSchema),
    });

  const submitUserData = useCallback(
    async (data: UserDataForm) => {
      if (!user?.hasura || !user?.hasura.id) {
        return toast.error("Error occurred while saving profile.");
      }

      try {
        await updateUser({
          variables: {
            id: user.hasura.id,
            userData: { name: data.name },
          },
        });
      } catch (error) {
        toast.error("Error occurred while saving profile.");
        reset(data);
      }
    },
    [user, updateUser, reset]
  );

  const deleteDialog = useToggle();

  return (
    <Layout mainClassName="grid gap-y-8">
      <div className="flex items-center gap-x-2">
        <Link className="flex items-center gap-x-1" href="/">
          <Icon name="home" className="w-3 h-3" />
          <span className="inline-block text-12 leading-[12px]">Home</span>
        </Link>

        <Icon name="chevron-right" className="w-3 h-3 text-gray-400" />

        <div className="flex items-center gap-x-1">
          <span className="inline-block text-12 leading-[12px]">Profile</span>
        </div>
      </div>

      {user.hasura.loading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!user.hasura.loading && user.hasura && (
        <form
          className="flex flex-col max-w-[560px] w-full mx-auto"
          onSubmit={handleSubmit(submitUserData)}
        >
          <h1 className="leading-8 font-medium text-24 text-gray-900">
            Profile
          </h1>

          <p className="mt-2 leading-5 text-14 text-gray-500">
            Manage your profile informations
          </p>

          <div className="grow">
            <div className="grid gap-y-8 -y-8 mt-12">
              <h2 className="-mb-2 leading-6 font-medium text-18 text-gray-900">
                Account
              </h2>

              <FieldInput
                label="Name"
                {...register("name")}
                readOnly={formState.isSubmitting}
                invalid={!!formState.errors.name}
              />

              <div className="relative">
                <FieldInput
                  label="Email"
                  value={user.auth0.email ?? ""}
                  readOnly
                />

                {user.auth0.email_verified && (
                  <div className="absolute top-0 right-0 flex items-center gap-x-0.5 h-full pr-4 text-12 text-gray-700">
                    <Icon name="badge-check2" noMask className="w-4 h-4" />
                    Verified email
                  </div>
                )}
              </div>

              {/* FIXME: implement WorldID connecting */}
              {/*<WorldId connected={true} verified={true}/>*/}
            </div>

            <div className="mt-12">
              <h2 className="leading-6 font-medium text-18 text-gray-900">
                Team
              </h2>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Link
                  href="/team"
                  className="flex items-center gap-x-3 p-4 border border-gray-200 rounded-xl shadow-card-new"
                >
                  <div className="grid place-items-center w-10 h-10 text-primary bg-primary-light rounded-full">
                    <Icon name="team" className="w-6 h-6 bg-primary" />
                  </div>

                  <div className="grow">
                    <div className="leading-5 font-medium text-14 text-gray-900">
                      {user?.hasura.team?.name}
                    </div>

                    <div className="leading-4 text-12 text-gray-700">Owner</div>
                  </div>

                  <div className="block h-4 text-gray-400">
                    <Icon name="arrow-right2" className="w-5 h-5" />
                  </div>
                </Link>

                {/* FIXME: implement joining flow */}
                {/*<button*/}
                {/*  className="flex items-center gap-x-3 px-4 py-6 text-gray-900 border border-dashed border-gray-300 rounded-xl"*/}
                {/*  type="submit"*/}
                {/*>*/}
                {/*  <Icon name="add" className="w-4 h-4"/>*/}

                {/*  <div className="leading-6 font-medium text-14">Join team</div>*/}
                {/*</button>*/}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Checkbox
              className="mb-6"
              label="I want to receive developer updates to email address"
              labelClassName="!h-auto !min-h-[24px]"
              iconClassName="!w-5 !h-5"
              checked={false}
            />

            <div className="flex space-x-3">
              <Button variant="contained" type="submit">
                {(formState.isDirty || !formState.isSubmitted) && (
                  <>Save changes</>
                )}

                {formState.isDirty &&
                  formState.isSubmitted &&
                  formState.isSubmitting && (
                    <>
                      <Icon name="spinner2" className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  )}

                {!formState.isDirty &&
                  formState.isSubmitted &&
                  !formState.isSubmitting &&
                  formState.isSubmitSuccessful && (
                    <>
                      <Icon name="check2" className="h-5 w-5" />
                      Saved
                    </>
                  )}
              </Button>

              <Button
                variant="outlined"
                type="button"
                onClick={deleteDialog.toggleOn}
              >
                Delete account
              </Button>
            </div>
          </div>
        </form>
      )}

      <DeleteAccountDialog
        open={deleteDialog.isOn}
        onClose={deleteDialog.toggleOff}
      />
    </Layout>
  );
});
