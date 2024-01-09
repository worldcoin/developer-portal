import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";
import { Auth } from "src/components/Auth";
import { Checkbox } from "src/components/Auth/Checkbox";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { Button } from "src/components/Button";
import { toast } from "react-toastify";
import { SignupBody } from "src/api/signup";
import { useToggle } from "src/hooks/useToggle";
import { DialogHeader } from "src/components/DialogHeader";
import { Dialog } from "src/components/Dialog";
import { Link } from "src/components/Link";
import { SignupSSRProps } from "@/pages/signup";
import { useUser } from "@auth0/nextjs-auth0/client";
import posthog from "posthog-js";

const schema = yup.object({
  teamName: yup.string().required("This field is required"),
  terms: yup
    .boolean()
    .required()
    .oneOf([true], "You must accept the terms and conditions"),

  updates: yup.boolean(),
});

type SignUpFormValues = yup.Asserts<typeof schema>;

type SignupProps = SignupSSRProps & {};

export function Signup(props: SignupProps) {
  const router = useRouter();
  const deleteDialog = useToggle(false);
  const { checkSession } = useUser();

  const {
    register,
    formState: { errors, dirtyFields, defaultValues, isSubmitting },
    handleSubmit,
    control,
  } = useForm<SignUpFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      teamName: props.invite?.team?.name ?? "",
    },
  });

  const submit = useCallback(
    async (values: SignUpFormValues) => {
      const response = await fetch("/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          team_name: values.teamName,
          invite_id: props.invite?.id,
        } as SignupBody),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error("Signup error", { error: errorData });
          posthog.capture("signup-failed", { error: errorData });
        } catch (error) {
          console.error("Signup error", { error });
          posthog.capture("signup-failed", { error: error });
        }
        return toast.error("Something went wrong. Please try again later.");
      }
      checkSession();

      const { returnTo } = await response.json();
      posthog.capture("signup-success");
      router.push(returnTo); // NOTE: We don't use enterApp because the return url may cause an infinite cycle
    },
    [checkSession, props.invite?.id, router]
  );

  const terms = useWatch({
    control,
    name: "terms",
  });

  const isFormValid = useMemo(() => {
    return (
      !errors.teamName &&
      terms === true &&
      (props.invite?.team
        ? Boolean(defaultValues?.teamName)
        : dirtyFields.teamName)
    );
  }, [
    defaultValues?.teamName,
    dirtyFields.teamName,
    errors.teamName,
    props.invite?.team,
    terms,
  ]);

  return (
    <Auth pageTitle="Sign Up" pageUrl="signup">
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
              className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="input your teams name"
              type="text"
              disabled={isSubmitting || Boolean(props.invite?.team?.name)}
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
          title="Are you sure you want to delete your account?"
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
