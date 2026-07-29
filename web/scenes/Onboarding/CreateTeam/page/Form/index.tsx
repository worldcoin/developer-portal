"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
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
// reach this form — the page redirects them to the in-portal dialog.
export const Form = () => {
  const router = useRouter();
  const { invalidate } = useUser();

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

    // The API already persisted the team and refreshed the sealed server
    // session. A client-profile refresh failure must not strand the user or
    // incorrectly report that team creation failed.
    await invalidate().catch(() => undefined);
    router.push(returnTo);
  };

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

        {errors.termsAndConditions ? (
          <p className="mt-2 pl-7 text-12 leading-[1.4] text-system-error-600">
            {errors.termsAndConditions.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="mt-10 inline-flex h-12 w-full max-w-[220px] cursor-pointer items-center justify-center rounded-8 bg-portal-ink px-6 text-14 leading-none font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden enabled:hover:bg-portal-ink-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Creating team…" : "Create team"}
      </button>
    </form>
  );
};
