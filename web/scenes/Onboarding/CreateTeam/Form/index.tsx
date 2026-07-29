"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { teamNameSchema } from "@/lib/schema";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
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
    const requestBody: CreateTeamBody = { team_name: values.teamName };

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

      await invalidate().catch(() => undefined);
      router.push(responseBody.returnTo);
      router.refresh();
    } catch {
      toast.error("We couldn't create your team. Please try again.");
    }
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

      <InkButton
        type="submit"
        disabled={!isValid || isSubmitting}
        className="h-11 w-full"
      >
        {isSubmitting ? "Creating team…" : "Create team"}
      </InkButton>
    </form>
  );
};
