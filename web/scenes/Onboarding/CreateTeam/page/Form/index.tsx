"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { urls } from "@/lib/urls";
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
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      teamName: "",
      termsAndConditions: false,
    },
  });

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
        className="block text-13 leading-none font-medium text-[#181818]"
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
        className="mt-2 w-full border-0 border-b-2 border-black/30 bg-transparent px-0 pb-3 text-[clamp(34px,5vw,52px)] leading-none font-light tracking-[-0.035em] text-[#181818] outline-hidden transition-colors focus:border-black focus:ring-0"
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
            className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-[#d6d9dd] accent-portal-ink"
          />
          <span className="text-13 leading-[1.5] text-[#757575]">
            I agree to the{" "}
            <a
              href={urls.tos()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#181818] underline underline-offset-2"
            >
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a
              href={urls.privacyStatement()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#181818] underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {errors.termsAndConditions ? (
          <p className="mt-2 pl-7 text-12 leading-[1.4] text-system-error-600">
            {errors.termsAndConditions.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="mt-10 inline-flex h-12 w-full max-w-[220px] cursor-pointer items-center justify-center rounded-8 bg-[#1f1f1f] px-6 text-14 leading-none font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden enabled:hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Creating team…" : "Create team"}
      </button>
    </form>
  );
};
