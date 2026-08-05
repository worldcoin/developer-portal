"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { urls } from "@/lib/urls";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

const schema = yup
  .object({
    teamName: teamNameSchema,
    termsAndConditions: yup
      .boolean()
      .required("Please accept the terms and conditions")
      .test(
        "accepted",
        "Please accept the terms and conditions",
        (value) => value === true,
      ),
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

// First-signup form: submitting records the terms acceptance and creates the
// user row alongside the team (see /api/create-team). Existing users never
// reach this form — the page redirects them to their profile.
export const Form = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      teamName: "",
      termsAndConditions: false,
    },
  });

  const termsAccepted = watch("termsAndConditions");

  const handleCreateTeam = async (values: FormValues) => {
    const requestBody: CreateTeamBody = {
      team_name: values.teamName,
      hasUser: false,
    };

    let returnTo: string;

    try {
      const response = await fetch("/api/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Create team request failed");
      }

      const responseBody = (await response.json()) as CreateTeamResponse;
      if (!responseBody.returnTo) {
        throw new Error("Create team response did not include a destination");
      }

      returnTo = responseBody.returnTo;
    } catch {
      toast.error("We couldn't create your team. Please try again.");
      return;
    }

    setIsRedirecting(true);

    try {
      window.sessionStorage.setItem(
        TEAM_CREATED_TOAST_STORAGE_KEY,
        values.teamName,
      );
    } catch {
      // Storage availability should not prevent navigation to the new team.
    }

    // Full navigation (not a client push) so the session-fed portal layout is
    // rebuilt with the freshly created team.
    window.location.replace(returnTo);
  };

  const isPending = isSubmitting || isRedirecting;

  return (
    <form onSubmit={handleSubmit(handleCreateTeam)} className="mt-12 grid">
      <label
        htmlFor="team-name"
        className="block text-13 leading-none font-medium text-portal-text"
      >
        Team name
      </label>

      <input
        id="team-name"
        {...register("teamName")}
        autoFocus
        autoComplete="organization"
        aria-invalid={Boolean(errors.teamName)}
        aria-describedby={errors.teamName ? "team-name-error" : undefined}
        className="mt-2 w-full border-0 border-b-2 border-black/30 bg-transparent px-0 pb-3 text-[clamp(34px,5vw,52px)] leading-none font-light tracking-[-0.035em] text-portal-text outline-hidden transition-colors focus:border-black focus:ring-0"
      />

      {errors.teamName ? (
        <p
          id="team-name-error"
          className="mt-3 text-12 leading-[1.4] text-system-error-600"
        >
          {errors.teamName.message}
        </p>
      ) : null}

      <div className="mt-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...register("termsAndConditions")}
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-grey-300 accent-portal-ink"
          />
          <span className="text-13 leading-[1.5] text-portal-muted">
            I agree to the{" "}
            <a
              href={urls.tos()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-portal-text underline underline-offset-2"
            >
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a
              href={urls.privacyStatement()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-portal-text underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>

      {/* The disabled state already signals the missing consent; the reminder
          only surfaces as a hover hint so the form never shouts in red. */}
      <div className="group relative mt-10 w-full max-w-[220px]">
        <InkButton
          type="submit"
          disabled={!isValid}
          loading={isPending}
          aria-describedby={!termsAccepted ? "terms-consent-hint" : undefined}
          className="h-12 w-full cursor-pointer px-6 text-14 disabled:bg-portal-ink disabled:text-white disabled:opacity-40"
        >
          {isPending ? "Creating team…" : "Create team"}
        </InkButton>

        {!termsAccepted ? (
          <span
            id="terms-consent-hint"
            role="tooltip"
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-8 bg-portal-ink px-3 py-2 text-12 leading-none whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            Please accept the terms and conditions
          </span>
        ) : null}
      </div>
    </form>
  );
};
