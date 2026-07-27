"use client";

import type { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { teamNameSchema } from "@/lib/schema";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

type CreateTeamFormProps = {
  hasPortalUser: boolean;
  presentation: "full-page" | "dialog";
};

export const CreateTeamForm = ({
  hasPortalUser,
  presentation,
}: CreateTeamFormProps) => {
  const router = useRouter();
  const { invalidate } = useUser();
  const isFullPage = presentation === "full-page";
  const inputId = `team-name-${presentation}`;
  const errorId = `${inputId}-error`;

  const schema = useMemo(
    () =>
      yup
        .object({
          teamName: teamNameSchema,
          termsAndConditions: hasPortalUser
            ? yup.boolean().notRequired()
            : yup
                .boolean()
                .isTrue("Please accept the terms and conditions")
                .required("Please accept the terms and conditions"),
        })
        .noUnknown(),
    [hasPortalUser],
  );

  type FormValues = yup.InferType<typeof schema>;

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
      hasUser: hasPortalUser,
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
    if (presentation === "dialog") {
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleCreateTeam)}
      className={clsx(
        "grid font-world",
        isFullPage
          ? "border-t border-black/30 md:grid-cols-[69.8%_30.2%]"
          : "gap-5",
      )}
    >
      <div
        className={clsx(
          isFullPage &&
            "px-2 py-8 md:min-h-[225px] md:border-r md:border-black/30 md:px-[50px] md:py-[48px]",
        )}
      >
        <label
          htmlFor={inputId}
          className={clsx(
            "block font-medium",
            isFullPage
              ? "text-18 leading-none text-[#111] md:text-20"
              : "mb-2 text-13 leading-none text-portal-text",
          )}
        >
          Team name
        </label>
        <input
          id={inputId}
          {...register("teamName")}
          autoFocus
          autoComplete="organization"
          aria-invalid={Boolean(errors.teamName)}
          aria-describedby={errors.teamName ? errorId : undefined}
          className={clsx(
            isFullPage
              ? "mt-7 h-auto w-full border-0 border-b-2 border-black bg-transparent px-0 pb-3 text-[clamp(38px,3.5vw,52px)] leading-none font-light tracking-[-0.035em] text-[#111] outline-hidden transition-colors focus:border-black focus:ring-0"
              : "h-11 w-full rounded-8 border bg-white px-3 text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200",
            !isFullPage &&
              (errors.teamName ? "border-system-error-400" : "border-grey-200"),
          )}
        />
        {errors.teamName ? (
          <p
            id={errorId}
            className={clsx(
              "mt-2 text-12 leading-[1.4] text-system-error-600",
              isFullPage && "md:text-13",
            )}
          >
            {errors.teamName.message}
          </p>
        ) : null}

        {!hasPortalUser ? (
          <div className="mt-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                {...register("termsAndConditions")}
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-grey-300 accent-portal-ink"
              />
              <span
                className={clsx(
                  "text-12 leading-[1.5] text-portal-muted",
                  isFullPage && "text-black/55",
                )}
              >
                I agree to the{" "}
                <a
                  href={urls.tos()}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    "font-medium underline underline-offset-2",
                    isFullPage ? "text-black/75" : "text-portal-text",
                  )}
                >
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a
                  href={urls.privacyStatement()}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    "font-medium underline underline-offset-2",
                    isFullPage ? "text-black/75" : "text-portal-text",
                  )}
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
        ) : null}
      </div>

      <div
        className={clsx(
          isFullPage &&
            "flex items-center justify-center px-2 py-8 md:min-h-[225px] md:pt-[68px] md:pr-[43px] md:pb-[59px] md:pl-[52px]",
        )}
      >
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={clsx(
            "inline-flex w-full cursor-pointer items-center justify-center font-medium transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed",
            isFullPage
              ? "group md:text-22 h-[98px] max-w-[340px] gap-2 rounded-[4px] bg-[#171717] px-8 text-20 leading-none text-white shadow-[0_14px_30px_rgba(0,0,0,0.10)] enabled:hover:bg-black disabled:opacity-40"
              : "h-11 rounded-8 bg-portal-ink px-4 text-13 leading-none text-white enabled:hover:bg-portal-ink-hover disabled:bg-grey-200 disabled:text-grey-400",
          )}
        >
          {isSubmitting ? "Creating team…" : "Create team"}
          {isFullPage ? (
            <span
              className={clsx(
                "-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none",
                isValid &&
                  !isSubmitting &&
                  "group-hover:ml-0 group-hover:w-7 group-hover:opacity-100",
              )}
            >
              <ArrowRightIcon className="size-7" />
            </span>
          ) : null}
        </button>
      </div>
    </form>
  );
};
