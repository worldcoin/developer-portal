import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";
import { Auth } from "src/components/Auth";
import { Checkbox } from "src/components/Auth/Checkbox";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { urls } from "src/lib/urls";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { Button } from "src/components/Button";
import { sendAcceptance } from "src/lib/ironclad-activity-api";
import { toast } from "react-toastify";
import { SetupBody } from "src/api/setup";
import { useToggle } from "src/hooks/useToggle";
import { DialogHeader } from "src/components/DialogHeader";
import { Dialog } from "src/components/Dialog";
import { Link } from "src/components/Link";

const schema = yup.object({
  teamName: yup.string().required("This field is required"),
  terms: yup
    .boolean()
    .required()
    .oneOf([true], "You must accept the terms and conditions"),

  updates: yup.boolean(),
});

type SignupFormValues = yup.Asserts<typeof schema>;

export function Setup(props: { hasAuth0User: boolean }) {
  const router = useRouter();
  const deleteDialog = useToggle(false);

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting },
    handleSubmit,
    control,
  } = useForm<SignupFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const submit = useCallback(
    async (values: SignupFormValues) => {
      const ironCladUserId = crypto.randomUUID();

      // NOTE: send acceptance
      try {
        await sendAcceptance(ironCladUserId);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong. Please try again later.");
        return;
      }

      const response = await fetch("/api/setup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          team_name: values.teamName,
          ironclad_id: ironCladUserId,
        } as SetupBody),
      });

      if (response.ok) {
        const { returnTo } = await response.json();
        localStorage.removeItem("signup_token");
        router.push(returnTo); // NOTE: We don't use enterApp because the return url may cause an infinite cycle
      }
      // FIXME: Handle errors
    },
    [router]
  );

  useEffect(() => {
    const signup_token = localStorage.getItem("signup_token");

    if (!signup_token && !props.hasAuth0User) {
      router.push(urls.login());
    }
  }, [props.hasAuth0User, router]);

  const terms = useWatch({
    control,
    name: "terms",
  });

  const isFormValid = useMemo(() => {
    return !errors.teamName && dirtyFields.teamName && terms === true;
  }, [dirtyFields.teamName, errors.teamName, terms]);

  const deleteAccount = useCallback(() => {}, []);

  return (
    <Auth pageTitle="Setup" pageUrl="setup">
      <form
        onSubmit={handleSubmit(submit)}
        className="grid justify-items-center max-w-[544px] p-12 gap-y-8"
      >
        <Illustration icon="user-solid" className="w-[88px] h-[88px]" />

        <div className="grid gap-y-2">
          <Typography variant="title">Nice to meet you</Typography>

          <Typography variant="subtitle">
            Set up your first team here.
          </Typography>
        </div>

        <div className="flex flex-col w-full">
          <FieldLabel required className="mb-2 font-rubik">
            Team name
          </FieldLabel>

          <div className="relative">
            <FieldInput
              register={register("teamName")}
              className="w-full font-rubik"
              placeholder="input your teams name"
              type="text"
              disabled={isSubmitting}
              required
              errors={errors.teamName}
            />

            {errors.teamName?.message && (
              <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
                {errors.teamName.message}
              </span>
            )}
          </div>
        </div>

        <div className="w-full grid gap-y-4">
          <Checkbox
            register={register("terms")}
            errors={errors.terms}
            className="font-rubik"
            label="I agree with the Developer Portal Terms, which incorporates by reference the Worldcoin User Terms and Conditions and the Worldcoin Privacy Statement."
            disabled={isSubmitting}
          />

          <Checkbox
            register={register("updates")}
            errors={errors.updates}
            className="font-rubik"
            label="I want to receive product updates about Worldcoin for developers."
            disabled={isSubmitting}
          />
        </div>

        <Button
          className="w-full h-[64px]"
          type="submit"
          disabled={!isFormValid}
        >
          Create my account
        </Button>

        <Button
          type="button"
          variant="plain"
          className="h-[64px] w-full"
          onClick={deleteDialog.toggleOn}
        >
          Delete my account
        </Button>
      </form>

      <Dialog open={deleteDialog.isOn} onClose={deleteDialog.toggleOff}>
        <DialogHeader
          title="Are you sure you want to delete account?"
          className="text-center"
        />

        <div className="grid grid-cols-2 gap-x-4">
          <Button type="button" className="w-full h-[64px]" variant="danger">
            <Link
              href="/api/auth/delete-account"
              className="w-full flex justify-center items-center h-full"
            >
              Delete
            </Link>
          </Button>

          <Button
            onClick={deleteDialog.toggleOff}
            type="button"
            className="w-full h-[64px]"
            variant="primary"
          >
            Cancel
          </Button>
        </div>
      </Dialog>
    </Auth>
  );
}
