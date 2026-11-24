"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { toast } from "react-toastify";

type MemberRole = "MEMBER" | "ADMIN";

// OWNER is intentionally absent: ownership is never granted from here.
const ROLE_OPTIONS: ReadonlyArray<{ value: MemberRole; label: string }> = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

const FIELD_CLASS_NAME =
  "h-9 min-w-0 rounded-12 border border-grey-200 bg-grey-0 px-3 text-14 text-grey-900 outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60";

const GENERIC_ERROR = "Couldn't add the account. Please try again.";

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
  return GENERIC_ERROR;
};

export const AddTeamMemberForm = (props: { teamId: string }) => {
  const router = useRouter();
  const emailId = useId();
  const roleId = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/teams/${encodeURIComponent(props.teamId)}/members`,
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

      toast.success(`Added ${email.trim()} to the team`);
      setEmail("");
      setRole("MEMBER");
      router.refresh();
    } catch {
      toast.error(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={emailId}>
        Account email
      </label>
      <input
        autoComplete="off"
        className={FIELD_CLASS_NAME}
        disabled={submitting}
        id={emailId}
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Account email"
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
        onChange={(event) => setRole(event.target.value as MemberRole)}
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
        Add user
      </DecoratedButton>
    </form>
  );
};
