"use client";

import type {
  ReviewChecklist,
  ReviewChecklistDefinitionSnapshot,
} from "@/api/admin/reviewer/request-schema";
import {
  REVIEWER_APPLICABILITY_NOTE_MAX_LENGTH,
  REVIEWER_CHECKLIST_EVIDENCE_MAX_LENGTH,
} from "@/lib/reviewer-limits";

import {
  LEGACY_REVIEW_CHECKLIST_VERSION,
  getChecklistDefinitions,
  getChecklistDisplayDefinitions,
  getChecklistProgress,
  isReviewChecklistVersionSupported,
} from "../checklist";
import type { ReviewerAppMode } from "../types";

export type ChecklistSaveState = "idle" | "saving" | "saved" | "error";

export type ReviewerChecklistProps = {
  checklist: ReviewChecklist;
  definitionSnapshot?: ReviewChecklistDefinitionSnapshot;
  disabled: boolean;
  mode: ReviewerAppMode;
  onAddNote: (note: string) => void;
  onChange: (checklist: ReviewChecklist) => void;
  onRetrySave: () => void;
  saveState: ChecklistSaveState;
  version: string;
};

const saveStateMessage: Record<ChecklistSaveState, string> = {
  idle: "",
  saving: "Saving checklist",
  saved: "Saved",
  error: "Checklist save failed. Retry save.",
};

const ChecklistSaveStatus = ({
  onRetrySave,
  saveState,
}: Pick<ReviewerChecklistProps, "onRetrySave" | "saveState">) => (
  <div aria-live="polite" className="mt-3 text-12 text-grey-500" role="status">
    {saveStateMessage[saveState]}
    {saveState === "error" ? (
      <button
        className="ml-2 font-semibold text-blue-500 hover:text-blue-600"
        onClick={onRetrySave}
        type="button"
      >
        Retry save
      </button>
    ) : null}
  </div>
);

const LegacyReviewerChecklist = ({
  checklist,
  disabled,
  mode,
  onChange,
  version,
}: Pick<
  ReviewerChecklistProps,
  "checklist" | "disabled" | "mode" | "onChange" | "version"
>) => {
  const definitions = getChecklistDefinitions(mode, version);
  const progress = getChecklistProgress(mode, checklist, version);
  const itemById = new Map(checklist.items.map((item) => [item.id, item]));

  const updateItem = (
    id: string,
    patch: Partial<ReviewChecklist["items"][number]> | null,
  ) => {
    const existing = itemById.get(id);
    const nextItems = checklist.items.filter((item) => item.id !== id);
    if (patch) {
      nextItems.push({
        id,
        status: patch.status ?? existing?.status ?? "pass",
        evidence: patch.evidence ?? existing?.evidence ?? "",
        ...(patch.applicabilityNote !== undefined || existing?.applicabilityNote
          ? {
              applicabilityNote:
                patch.applicabilityNote ?? existing?.applicabilityNote ?? "",
            }
          : {}),
      });
    }
    onChange({ ...checklist, items: nextItems });
  };

  return (
    <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-16 font-semibold text-grey-900">
            Review guidelines
          </h2>
          <p className="mt-1 text-12 text-grey-500">
            Checklist version {version} for this submitted app mode.
          </p>
        </div>
        <div className="min-w-40">
          <div className="flex justify-between text-11 font-medium text-grey-500">
            <span>Completion</span>
            <span>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div
            aria-label="Checklist completion"
            aria-valuemax={progress.total}
            aria-valuemin={0}
            aria-valuenow={progress.completed}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-grey-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {definitions.map((definition) => {
          const result = itemById.get(definition.id);
          return (
            <article
              className="rounded-12 border border-grey-200 bg-grey-50 p-4"
              key={definition.id}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-13 font-semibold text-grey-900">
                      {definition.title}
                    </h3>
                    {definition.conditional ? (
                      <span className="rounded-full bg-grey-200 px-2 py-0.5 text-10 font-medium text-grey-500">
                        Conditional
                      </span>
                    ) : null}
                  </div>
                  <p className="text-grey-600 mt-1 text-12 leading-5">
                    {definition.description}
                  </p>
                  <a
                    className="mt-2 inline-flex text-11 font-medium text-blue-500 hover:text-blue-600"
                    href={definition.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source guidance
                  </a>
                </div>
                <label className="grid content-start gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
                  Check status
                  <select
                    aria-label={`${definition.title} check status`}
                    className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-12 font-normal tracking-normal text-grey-900 normal-case disabled:bg-grey-100"
                    disabled={disabled}
                    onChange={(event) => {
                      const status = event.target.value;
                      if (!status) return updateItem(definition.id, null);
                      updateItem(definition.id, {
                        status: status as "pass" | "fail" | "na",
                        ...(status === "na"
                          ? {}
                          : { applicabilityNote: undefined }),
                      });
                    }}
                    value={result?.status ?? ""}
                  >
                    <option value="">Not checked</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="na">N/A</option>
                  </select>
                </label>
              </div>
              {result ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="grid gap-1 text-11 font-medium text-grey-500">
                    Evidence note
                    <textarea
                      aria-label={`${definition.title} evidence note`}
                      className="min-h-20 resize-y rounded-8 border border-grey-200 bg-grey-0 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
                      disabled={disabled}
                      maxLength={REVIEWER_CHECKLIST_EVIDENCE_MAX_LENGTH}
                      onChange={(event) =>
                        updateItem(definition.id, {
                          evidence: event.target.value,
                        })
                      }
                      value={result.evidence}
                    />
                  </label>
                  {result.status === "na" ? (
                    <label className="grid gap-1 text-11 font-medium text-grey-500">
                      Applicability note
                      <textarea
                        aria-label={`${definition.title} applicability note`}
                        className="min-h-20 resize-y rounded-8 border border-grey-200 bg-grey-0 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
                        disabled={disabled}
                        maxLength={REVIEWER_APPLICABILITY_NOTE_MAX_LENGTH}
                        onChange={(event) =>
                          updateItem(definition.id, {
                            applicabilityNote: event.target.value,
                          })
                        }
                        required
                        value={result.applicabilityNote ?? ""}
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export const ReviewerChecklist = ({
  checklist,
  definitionSnapshot,
  disabled,
  mode,
  onAddNote,
  onChange,
  onRetrySave,
  saveState,
  version,
}: ReviewerChecklistProps) => {
  const versionSupported = isReviewChecklistVersionSupported(version);
  const definitions = getChecklistDisplayDefinitions({
    mode,
    snapshot: definitionSnapshot,
    version,
  });
  const isLegacy = version === LEGACY_REVIEW_CHECKLIST_VERSION;

  if (isLegacy) {
    return (
      <>
        <LegacyReviewerChecklist
          checklist={checklist}
          disabled={disabled}
          mode={mode}
          onChange={onChange}
          version={version}
        />
        <ChecklistSaveStatus onRetrySave={onRetrySave} saveState={saveState} />
      </>
    );
  }

  const readOnly = !versionSupported;
  const itemById = new Map(checklist.items.map((item) => [item.id, item]));
  const completed = definitions.filter((definition) =>
    itemById.has(definition.id),
  ).length;
  const progress = versionSupported
    ? getChecklistProgress(mode, checklist, version)
    : {
        completed,
        total: definitions.length,
        percent: definitions.length
          ? Math.round((completed / definitions.length) * 100)
          : 0,
      };

  const updateStatus = (id: string, status: "pass" | "fail" | "na") => {
    const existing = itemById.get(id);
    const nextItem =
      status === "fail"
        ? { id, status, evidence: existing?.evidence ?? "" }
        : status === "na"
          ? { id, status, evidence: "", applicabilityNote: "" }
          : { id, status, evidence: "" };
    onChange({
      ...checklist,
      items: [...checklist.items.filter((item) => item.id !== id), nextItem],
    });
  };

  const updateNote = (
    id: string,
    field: "evidence" | "applicabilityNote",
    value: string,
  ) => {
    onChange({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    });
  };

  return (
    <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-16 font-semibold text-grey-900">
            Review checklist
          </h2>
          <p className="mt-1 text-12 text-grey-500">
            Checklist version {version} for this submitted app mode.
          </p>
        </div>
        <div className="min-w-40">
          <div className="flex justify-between text-11 font-medium text-grey-500">
            <span>Completion</span>
            <span>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div
            aria-label="Checklist completion"
            aria-valuemax={progress.total}
            aria-valuemin={0}
            aria-valuenow={progress.completed}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-grey-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {readOnly ? (
        <p className="text-grey-600 mt-4 rounded-8 border border-grey-200 bg-grey-50 p-3 text-12">
          This checklist version is read-only. Stored definition labels are
          shown for historical context.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {definitions.map((definition) => {
          const result = itemById.get(definition.id);
          const controlsDisabled = disabled || readOnly;
          return (
            <article
              className="rounded-12 border border-grey-200 bg-grey-50 p-4"
              key={definition.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-13 font-semibold text-grey-900">
                      {definition.title}
                    </h3>
                    {definition.conditional ? (
                      <span className="rounded-full bg-grey-200 px-2 py-0.5 text-10 font-medium text-grey-500">
                        Conditional
                      </span>
                    ) : null}
                  </div>
                  <p className="text-grey-600 mt-1 text-12 leading-5">
                    {definition.description}
                  </p>
                  <a
                    className="mt-2 inline-flex text-11 font-medium text-blue-500 hover:text-blue-600"
                    href={definition.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source guidance
                  </a>
                </div>
                {!readOnly ? (
                  <div
                    aria-label={`${definition.title} check status`}
                    className="flex gap-1"
                    role="group"
                  >
                    {(
                      [
                        ["pass", "Pass"],
                        ["fail", "Issue"],
                        ["na", "N/A"],
                      ] as const
                    ).map(([status, label]) => (
                      <button
                        aria-pressed={result?.status === status}
                        className="rounded-8 border border-grey-200 bg-grey-0 px-3 py-2 text-12 font-medium text-grey-700 disabled:bg-grey-100"
                        disabled={controlsDisabled}
                        key={status}
                        onClick={() => updateStatus(definition.id, status)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {result?.status === "fail" && !readOnly ? (
                <label className="mt-4 grid gap-1 text-11 font-medium text-grey-500">
                  Issue note
                  <textarea
                    aria-label={`${definition.title} issue note`}
                    className="min-h-20 resize-y rounded-8 border border-grey-200 bg-grey-0 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
                    disabled={controlsDisabled}
                    maxLength={REVIEWER_CHECKLIST_EVIDENCE_MAX_LENGTH}
                    onChange={(event) =>
                      updateNote(definition.id, "evidence", event.target.value)
                    }
                    value={result.evidence}
                  />
                  {result.evidence.trim() ? (
                    <button
                      className="justify-self-start text-12 font-semibold text-blue-500 hover:text-blue-600"
                      disabled={controlsDisabled}
                      onClick={() => onAddNote(result.evidence)}
                      type="button"
                    >
                      Add note to message
                    </button>
                  ) : null}
                </label>
              ) : null}

              {result?.status === "na" && !readOnly ? (
                <label className="mt-4 grid gap-1 text-11 font-medium text-grey-500">
                  Not applicable note
                  <textarea
                    aria-label={`${definition.title} not applicable note`}
                    className="min-h-20 resize-y rounded-8 border border-grey-200 bg-grey-0 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
                    disabled={controlsDisabled}
                    maxLength={REVIEWER_APPLICABILITY_NOTE_MAX_LENGTH}
                    onChange={(event) =>
                      updateNote(
                        definition.id,
                        "applicabilityNote",
                        event.target.value,
                      )
                    }
                    value={result.applicabilityNote ?? ""}
                  />
                </label>
              ) : null}
            </article>
          );
        })}
      </div>
      <ChecklistSaveStatus onRetrySave={onRetrySave} saveState={saveState} />
    </section>
  );
};
