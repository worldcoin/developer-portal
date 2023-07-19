import { useRouter } from "next/router";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Auth } from "src/components/Auth";
import { Checkbox } from "src/components/Auth/Checkbox";
import { FieldText } from "src/components/Auth/FieldText";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { urls } from "src/lib/urls";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { Button } from "src/components/Button";
import { ironCladActivityApi } from "src/lib/ironclad-activity-api";
import { toast } from "react-toastify";

const schema = yup.object({
  email: yup.string().email(),
  teamName: yup.string().required("This field is required"),
  terms: yup
    .boolean()
    .required()
    .oneOf([true], "You must accept the terms and conditions"),

  updates: yup.boolean(),
});

type SignupFormValues = yup.Asserts<typeof schema>;

export function Signup() {
  const router = useRouter();

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting, touchedFields },
    handleSubmit,
    control,
    reset,
  } = useForm<SignupFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (router.isReady) {
      const email = router.query.email;

      if (!email) {
        return;
      }

      if (typeof email === "string") {
        reset({ email });
      }

      if (Array.isArray(email)) {
        reset({ email: email[0] });
      }
    }
  }, [reset, router.isReady, router.query.email]);

  const submit = useCallback(
    async (values: SignupFormValues) => {
      const signup_token = localStorage.getItem("signup_token");
      const ironcladId = crypto.randomUUID();
      const ironClad = await ironCladActivityApi({ signerId: ironcladId });

      try {
        new Promise(async (resolve, reject) => {
          if (!ironClad || !ironClad.sendAcceptance) {
            throw new Error("Cannot init ironclad");
          }

          await ironClad.sendAcceptance({
            onSuccess: resolve,
            onError: reject,
          });
        });
      } catch (err) {
        toast.error("Something went wrong");
        console.log(err);
        return;
      }

      // FIXME: move to axios
      const response = await fetch("/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: values.email,
          team_name: values.teamName,
          signup_token,
          ironclad_id: ironcladId,
        }),
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
    if (!signup_token) {
      router.push(urls.login());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to run this only onces
  }, []);

  const email = useWatch({
    control,
    name: "email",
  });

  const terms = useWatch({
    control,
    name: "terms",
  });

  const isFormValid = useMemo(() => {
    return (
      !errors.email &&
      !errors.teamName &&
      dirtyFields.teamName &&
      terms === true
    );
  }, [dirtyFields.teamName, errors.email, errors.teamName, terms]);

  const shouldShowEmailNote = useMemo(() => {
    return !email && (touchedFields["email"] || dirtyFields["teamName"]);
  }, [dirtyFields, email, touchedFields]);

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
            Just a few details to create your account
          </Typography>
        </div>

        <div className="grid w-full gap-y-3">
          {shouldShowEmailNote && (
            <div className="grid grid-cols-auto/1fr gap-x-3 items-center bg-accents-info-700/10 rounded-xl py-2.5 px-4">
              <div className="w-1.5 h-1.5 bg-accents-info-700 rounded-full" />

              <span className="text-accents-info-700 text-12">
                To enable account recovery, add your email address
              </span>
            </div>
          )}

          <div className="grid gap-y-2">
            <FieldLabel className="font-rubik">Email</FieldLabel>

            <div className="relative">
              <FieldInput
                register={register("email")}
                className="w-full font-rubik"
                placeholder="enter email address"
                type="email"
                disabled={isSubmitting}
                errors={errors.email}
              />
            </div>
          </div>

          <FieldText>
            {errors.email?.message ? (
              <span className="flex items-center text-12 text-danger">
                {errors.email.message}
              </span>
            ) : (
              "Only for transactional notifications, unless you want to receive updates"
            )}
          </FieldText>
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
      </form>
    </Auth>
  );
}
