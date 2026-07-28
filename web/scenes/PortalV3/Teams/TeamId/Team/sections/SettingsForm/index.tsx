"use client";
import { teamNameSchema } from "@/lib/schema";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { Image as TeamImage } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile/Image";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { validateAndUpdateTeamServerSide } from "../../Settings/server/submit";

const schema = yup
  .object({
    name: teamNameSchema,
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

// Team name comes from the parent settings page (single fetch); `onSaved` lets
// the parent refetch after a successful update so its copy stays in sync.
// `canWrite` makes the display-name field read-only for non-owners.
export const TeamSettingsForm = (props: {
  teamId: string;
  teamName: string;
  memberCount: number;
  canWrite: boolean;
  onSaved?: () => void;
}) => {
  const { teamId, teamName, memberCount, canWrite, onSaved } = props;
  const { refetch: refetchMe } = useRefetchQueries(FetchMeDocument);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: teamName,
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    reset({ name: teamName });
  }, [reset, teamName]);

  const submit = useCallback(
    async (values: FormValues) => {
      if (!canWrite) {
        return;
      }

      const result = await validateAndUpdateTeamServerSide(values.name, teamId);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Your team was successfully updated");
        await Promise.all([onSaved?.(), refetchMe()]);
        reset(values);
      }
    },
    [canWrite, teamId, onSaved, refetchMe, reset],
  );

  return (
    <form
      className="flex min-w-0 items-center gap-4"
      onSubmit={handleSubmit(submit)}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-full">
        <TeamImage
          src={null}
          teamName={teamName}
          alt="Team logo"
          className="rounded-full"
        />
      </div>

      <div className="min-w-0 flex-1">
        <input
          {...register("name")}
          aria-label="Team name"
          aria-invalid={errors.name ? "true" : "false"}
          readOnly={!canWrite}
          className={clsx(
            "-ml-2 block h-9 w-full max-w-xl rounded-8 border bg-transparent px-2 font-twk text-[22px] leading-7 font-[550] text-grey-900 outline-hidden transition-colors",
            {
              "cursor-text border-transparent hover:border-grey-200 focus:border-blue-150 focus:ring-2 focus:ring-blue-150":
                canWrite && !errors.name,
              "border-system-error-500 focus:ring-2 focus:ring-system-error-200":
                canWrite && errors.name,
              "cursor-default border-transparent": !canWrite,
            },
          )}
        />

        <p className="mt-0.5 truncate font-gta text-13 leading-5 text-grey-400">
          Team settings · {memberCount}{" "}
          {memberCount === 1 ? "member" : "members"}
        </p>

        {errors.name?.message ? (
          <p className="mt-1 font-gta text-12 text-system-error-500">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      {canWrite && isDirty ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-48px)] -translate-x-1/2 items-center gap-2 rounded-12 bg-portal-ink p-2 pl-4 shadow-lg md:left-[calc(50%+140px)]">
          <span className="mr-2 font-world text-13 whitespace-nowrap text-white/75">
            Unsaved changes
          </span>

          <button
            type="button"
            onClick={() => reset({ name: teamName })}
            className="h-8 rounded-8 px-3 font-world text-13 font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:outline-hidden"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="h-8 rounded-8 bg-white px-4 font-world text-13 font-medium text-portal-ink transition-colors hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-300 disabled:text-grey-500"
          >
            Save
          </button>
        </div>
      ) : null}
    </form>
  );
};
