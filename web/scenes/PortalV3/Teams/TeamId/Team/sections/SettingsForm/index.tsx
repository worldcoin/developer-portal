"use client";
import { teamNameSchema } from "@/lib/schema";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { TextField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/TextField";
import {
  AutosaveStatus,
  useAutosave,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
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
// `canWrite` makes the display-name field unavailable to non-owners.
export const TeamSettingsForm = (props: {
  teamId: string;
  teamName: string;
  canWrite: boolean;
  onSaved?: () => void;
}) => {
  const { teamId, teamName, canWrite, onSaved } = props;
  const { refetch: refetchMe } = useRefetchQueries(FetchMeDocument);
  const { invalidate } = useUser();
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      name: teamName,
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });
  const {
    control,
    reset,
    formState: { errors },
  } = form;
  const previousTeamNameRef = useRef(teamName);

  useEffect(() => {
    if (previousTeamNameRef.current === teamName) {
      return;
    }

    previousTeamNameRef.current = teamName;
    if (!form.getFieldState("name").isDirty) {
      reset({ name: teamName });
    }
  }, [form, reset, teamName]);

  const save = useCallback(
    async (values: FormValues, signal: AbortSignal) => {
      const result = await validateAndUpdateTeamServerSide(values.name, teamId);
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (!result.success) {
        throw new Error(result.message);
      }

      const [sessionResponse] = await Promise.all([
        fetch("/api/update-session", { method: "POST" }).catch(() => null),
        Promise.allSettled([onSaved?.(), refetchMe()]),
      ]);

      if (sessionResponse?.ok) {
        await invalidate();
      }

      router.refresh();
    },
    [invalidate, onSaved, refetchMe, router, teamId],
  );

  const onAutosaveStatus = useCallback((status: AutosaveStatus) => {
    if (status.state === "saved") {
      toast.success("Team name updated");
    } else if (status.state === "error") {
      toast.error(status.error.message);
    }
  }, []);

  useAutosave<FormValues>({
    form,
    save,
    enabled: canWrite,
    debounceMs: 1500,
    onStatus: onAutosaveStatus,
  });

  return (
    <div className="w-full max-w-xl">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Team name"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={!canWrite}
            error={errors.name?.message}
            maxLength={128}
            required
            hideLabel
          />
        )}
      />
    </div>
  );
};
