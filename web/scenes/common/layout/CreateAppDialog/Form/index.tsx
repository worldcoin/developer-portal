"use client";

import { APP_CREATED_TOAST_STORAGE_KEY } from "@/lib/app-created-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import posthog from "posthog-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createAppSchemaV4, type CreateAppSchemaV4 } from "../form-schema-v4";
import { validateAndInsertAppServerSideV4 } from "../server/v4/submit";

const defaultValues: Partial<CreateAppSchemaV4> = {
  build: "production",
  verification: "cloud",
  is_miniapp: false,
};

type CreateAppFormProps = {
  teamId?: string;
};

export const CreateAppForm = ({ teamId }: CreateAppFormProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    formState: { isValid, errors, isSubmitting },
    handleSubmit,
  } = useForm<CreateAppSchemaV4>({
    mode: "onChange",
    resolver: yupResolver(createAppSchemaV4),
    defaultValues,
  });

  const submit = async (values: CreateAppSchemaV4) => {
    if (!teamId) {
      toast.error("Failed to create app");
      return;
    }

    try {
      const result = await validateAndInsertAppServerSideV4(values, teamId);

      if (!result.success) {
        toast.error(result.message);
        posthog.capture("app_creation_failed", {
          team_id: teamId,
          environment: values.build,
          engine: values.verification,
          error: result.error,
        });
        return;
      }

      const newAppId =
        typeof result.app_id === "string" ? result.app_id : undefined;

      posthog.capture("app_creation_successful", {
        team_id: teamId,
        app_id: newAppId,
        environment: values.build,
        engine: values.verification,
      });

      // Keep the dialog open with the button pending until the browser swaps
      // pages — closing first flashes the stale screen underneath.
      setIsRedirecting(true);

      try {
        window.sessionStorage.setItem(
          APP_CREATED_TOAST_STORAGE_KEY,
          values.name,
        );
      } catch {
        // Storage availability should not prevent navigation to the new app.
      }

      // Full navigation (not a client push) so the session-fed portal layout is
      // rebuilt with the freshly created app.
      window.location.replace(
        newAppId ? `/teams/${teamId}/apps/${newAppId}` : `/teams/${teamId}`,
      );
    } catch (error) {
      toast.error("An error occurred while creating the app");
      posthog.capture("app_creation_failed", {
        team_id: teamId,
        environment: values.build,
        engine: values.verification,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const isPending = isSubmitting || isRedirecting;

  const inputId = "create-app-name";
  const errorId = `${inputId}-error`;

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-5 font-world">
      <div>
        <label
          htmlFor={inputId}
          className="mb-2 block text-13 leading-none font-medium text-portal-text"
        >
          App name
        </label>
        <input
          id={inputId}
          {...register("name")}
          autoFocus
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? errorId : undefined}
          className={`h-11 w-full rounded-8 border bg-white px-3 text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200 ${
            errors.name ? "border-system-error-400" : "border-grey-200"
          }`}
          data-testid="input-app-name"
        />
        {errors.name ? (
          <p
            id={errorId}
            className="mt-2 text-12 leading-[1.4] text-system-error-600"
          >
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-8 bg-portal-ink px-4 text-13 leading-none font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden enabled:hover:bg-portal-ink-hover disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400"
        data-testid="button-create-app"
      >
        {isPending ? "Creating app…" : "Create app"}
      </button>
    </form>
  );
};
