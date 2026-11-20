"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { toast } from "react-toastify";

type InviteRole = "MEMBER" | "ADMIN";

// OWNER is intentionally absent: ownership is never granted by invite.
const ROLE_OPTIONS: ReadonlyArray<{ value: InviteRole; label: string }> = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

const FIELD_CLASS_NAME =
  "h-9 rounded-12 border border-grey-200 bg-grey-0 px-3 text-14 text-grey-900 outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60";

const readErrorMessage = async (response: Response) => {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const { error, detail } = body as { error?: unknown; detail?: unknown };
      if (typeof error === "string") return error;
      if (typeof detail === "string") return detail;
    }
  } catch {
    // Fall through to the generic message.
  }
  return "Couldn't send the invite. Please try again.";
};

export const InviteTeamMemberForm = (props: { teamId: string }) => {
  const router = useRouter();
  const emailId = useId();
  const roleId = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/teams/${encodeURIComponent(props.teamId)}/invites`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, role }),
        },
      );

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }

      const result = (await response.json()) as { refreshed?: boolean };
      toast.success(
        result.refreshed
          ? `Invite to ${email.trim()} refreshed and resent`
          : `Invite sent to ${email.trim()}`,
      );
      setEmail("");
      setRole("MEMBER");
      router.refresh();
    } catch {
      toast.error("Couldn't send the invite. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={emailId}>
        Email
      </label>
      <input
        autoComplete="off"
        className={FIELD_CLASS_NAME}
        disabled={submitting}
        id={emailId}
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        required
        type="email"
        value={email}
      />
      <label className="sr-only" htmlFor={roleId}>
        Role
      </label>
      <select
        className={FIELD_CLASS_NAME}
        disabled={submitting}
        id={roleId}
        onChange={(event) => setRole(event.target.value as InviteRole)}
        value={role}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <DecoratedButton
        className="h-9 px-4 py-1.5 text-12 whitespace-nowrap"
        loading={submitting}
        type="submit"
        variant="secondary"
      >
        Send invite
      </DecoratedButton>
    </form>
  );
};
