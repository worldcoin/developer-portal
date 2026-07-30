"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

const schema = yup
  .object({
    teamName: teamNameSchema,
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

// Dialog form for creating additional teams. First-team creation (which
// requires terms acceptance) happens on the standalone /create-team page.
export const CreateTeamForm = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: { teamName: "" },
  });

  const handleCreateTeam = async (values: FormValues) => {
    const requestBody: CreateTeamBody = {
      team_name: values.teamName,
      hasUser: true,
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
    <form
      onSubmit={handleSubmit(handleCreateTeam)}
      className="grid gap-5 font-world"
    >
      <div>
        <label
          htmlFor="team-name-dialog"
          className="mb-2 block text-13 leading-none font-medium text-portal-text"
        >
          Team name
        </label>
        <input
          id="team-name-dialog"
          {...register("teamName")}
          autoFocus
          autoComplete="organization"
          aria-invalid={Boolean(errors.teamName)}
          aria-describedby={
            errors.teamName ? "team-name-dialog-error" : undefined
          }
          className={`h-11 w-full rounded-8 border bg-grey-0 px-3 text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200 ${
            errors.teamName ? "border-system-error-400" : "border-grey-200"
          }`}
        />
        {errors.teamName ? (
          <p
            id="team-name-dialog-error"
            className="mt-2 text-12 leading-[1.4] text-system-error-600"
          >
            {errors.teamName.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-8 bg-portal-ink px-4 text-13 leading-none font-medium text-grey-0 transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden enabled:hover:bg-portal-ink-hover disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400"
      >
        {isPending ? "Creating team…" : "Create team"}
      </button>
    </form>
  );
};
