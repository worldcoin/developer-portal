"use client";

import { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { teamNameSchema } from "@/lib/schema";
import { urls } from "@/lib/urls";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

export const Form = (props: { hasUser: boolean }) => {
  const schema = useMemo(
    () =>
      yup
        .object({
          hasUser: yup.boolean().default(props.hasUser),
          teamName: teamNameSchema,
          termsAndConditions: yup.boolean().when("hasUser", {
            is: false,
            then: (schema) =>
              schema
                .isTrue("Please, accept terms and conditions")
                .required("Please, accept terms and conditions"),
            otherwise: (schema) => schema.notRequired(),
          }),

          // FIXME: Return when we have product updates
          // productUpdates: yup.boolean().optional(),
        })
        .noUnknown(),
    [props.hasUser],
  );

  type FormValues = yup.InferType<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const submit = useCallback(async (values: FormValues) => {
    const body: CreateTeamBody = {
      team_name: values.teamName,
      hasUser: values.hasUser,
    };

    let data: CreateTeamResponse | null = null;

    try {
      const res = await fetch("/api/create-team", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      data = await res.json();
    } catch (error) {
      return toast.error("Something went wrong");
    }

    if (!data || !data.returnTo) {
      return console.log("Something went wrong");
    }

    window.location.replace(data.returnTo);
  }, []);

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-y-8">
      <Input
        register={register("teamName")}
        label="Team name"
        className="w-full"
        placeholder="Name will be visible to the members"
        required
        errors={errors.teamName}
      />

      {!props.hasUser && (
        <div className="grid gap-y-8 rounded-xl border border-grey-200 p-6">
          <div className="grid grid-cols-auto/1fr gap-x-3">
            <Checkbox register={register("termsAndConditions")} />
            <Typography variant={TYPOGRAPHY.R3}>
              I agree with the{" "}
              <Button href={urls.tos()} target="_blank" className="underline">
                Terms & Conditions
              </Button>{" "}
              and{" "}
              <Button
                href={urls.privacyStatement()}
                target="_blank"
                className="underline"
              >
                Privacy Policy
              </Button>
              <span className="text-system-error-600">*</span>
            </Typography>
          </div>

          {/* FIXME: Return when we have product updates */}
          {/* <div className="grid grid-cols-auto/1fr gap-x-3 gap-y-1">
            <Checkbox
              register={register("productUpdates")}
              className="col-start-1 row-start-1"
            />

            <Typography
              variant={TYPOGRAPHY.R3}
              className="col-start-2 row-start-1"
            >
              I want to receive product updates
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R4}
              className="col-start-2 row-start-2 text-gray-400"
            >
              Once in a while we will send you an email with current updates
              about World ID for developers
            </Typography>
          </div> */}
        </div>
      )}

      <InkButton
        type="submit"
        className="mt-2 h-11 w-[180px] justify-self-center"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <SpinnerIcon aria-hidden className="size-5 animate-spin" />
            <span className="sr-only">Creating team</span>
          </>
        ) : (
          "Create team"
        )}
      </InkButton>
    </form>
  );
};
