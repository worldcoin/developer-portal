"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { invalidate } = useUser();

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

    // The API already persisted the team and refreshed the sealed server
    // session. A client-profile refresh failure must not strand the user or
    // incorrectly report that team creation failed.
    await invalidate().catch(() => undefined);
    router.push(returnTo);

    // The in-portal dialog preserves the session-fed portal layout.
    router.refresh();
  };

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
          className={`h-11 w-full rounded-8 border bg-white px-3 text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200 ${
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
        disabled={!isValid || isSubmitting}
        className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-8 bg-portal-ink px-4 text-13 leading-none font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden enabled:hover:bg-portal-ink-hover disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400"
      >
        {isSubmitting ? "Creating team…" : "Create team"}
      </button>
    </form>
  );
};
