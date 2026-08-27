"use client";

import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";

import {
  getChecklistDefinitions,
  getChecklistProgress,
  isReviewChecklistVersionSupported,
} from "../checklist";
import type { ReviewerAppMode } from "../types";

export const ReviewGuidelines = ({
  checklist,
  disabled,
  mode,
  onChange,
  version,
}: {
  checklist: ReviewChecklist;
  disabled: boolean;
  mode: ReviewerAppMode;
  onChange: (checklist: ReviewChecklist) => void;
  version: string;
}) => {
  const versionSupported = isReviewChecklistVersionSupported(version);
  const definitions = getChecklistDefinitions(mode, version);
  const progress = getChecklistProgress(mode, checklist, version);
  const byId = new Map(checklist.items.map((item) => [item.id, item]));

  const updateItem = (
    id: string,
    patch: Partial<ReviewChecklist["items"][number]> | null,
  ) => {
    const existing = byId.get(id);
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
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-grey-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {!versionSupported ? (
        <p className="mt-4 rounded-8 border border-system-error-200 bg-system-error-100 p-3 text-12 text-system-error-700">
          Checklist version {version} is unavailable. This review is read-only
          until its stored definition is restored.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {definitions.map((definition) => {
          const result = byId.get(definition.id);
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
