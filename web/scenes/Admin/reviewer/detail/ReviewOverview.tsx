import { buildReviewerSnapshotDiff } from "../metadata-diff";
import type { ReviewerSubmissionDetail } from "../types";

const value = (input: unknown) => {
  if (input === null || input === undefined || input === "") return "—";
  return typeof input === "string" ? input : JSON.stringify(input);
};

const submissionAge = (submittedAt: string) => {
  const elapsed = Date.now() - Date.parse(submittedAt);
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Unknown";
  const hours = Math.floor(elapsed / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export const ReviewOverview = ({
  submission,
}: {
  submission: ReviewerSubmissionDetail;
}) => {
  const differences = buildReviewerSnapshotDiff({
    metadataSnapshot: submission.metadataSnapshot,
    localizationsSnapshot: submission.localizationsSnapshot,
    liveMetadata: submission.liveMetadata,
    liveLocalizations: submission.liveLocalizations,
  });

  return (
    <div className="grid gap-5">
      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">Submission</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Team", `${submission.teamName} · ${submission.teamId}`],
            ["Listing target", submission.listingTarget.replaceAll("_", " ")],
            ["Submitted", new Date(submission.submittedAt).toLocaleString()],
            ["Submission age", submissionAge(submission.submittedAt)],
            [
              "Current live version",
              submission.liveMetadata
                ? `${value(submission.liveMetadata.id)} · ${value(
                    submission.liveMetadata.verified_at ??
                      submission.liveMetadata.updated_at,
                  )}`
                : "None",
            ],
            ["Attempt", String(submission.attempt)],
            [
              "Listing consent",
              submission.listingConsent ? "Confirmed" : "Missing",
            ],
            ["Metadata version", submission.appMetadataId],
            ["Review version", String(submission.reviewVersion)],
          ].map(([label, itemValue]) => (
            <div className="rounded-8 bg-grey-50 p-3" key={label}>
              <dt className="text-11 font-medium tracking-wide text-grey-400 uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-13 font-medium break-words text-grey-900">
                {itemValue}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-8 border border-grey-200 p-3">
          <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
            Developer submission note
          </p>
          <p className="mt-2 text-13 leading-5 whitespace-pre-wrap text-grey-700">
            {submission.changelog || "No changelog supplied."}
          </p>
        </div>
      </section>

      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-16 font-semibold text-grey-900">
            Draft vs live changes
          </h2>
          <span className="rounded-full bg-grey-100 px-2.5 py-1 text-11 font-medium text-grey-500">
            {differences.length} changed fields
          </span>
        </div>
        {differences.length ? (
          <div className="mt-4 overflow-auto rounded-8 border border-grey-200">
            <table className="w-full min-w-[620px] text-left text-12">
              <thead className="bg-grey-50 text-11 font-medium tracking-wide text-grey-400 uppercase">
                <tr>
                  <th className="p-3">Field</th>
                  <th className="p-3">Submitted draft</th>
                  <th className="p-3">Current live</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {differences.map((difference) => (
                  <tr key={difference.field}>
                    <th
                      className="p-3 font-mono font-medium text-grey-700"
                      scope="row"
                    >
                      {difference.field}
                    </th>
                    <td className="max-w-sm p-3 text-system-warning-700">
                      <code className="break-words">
                        {value(difference.draftValue)}
                      </code>
                    </td>
                    <td className="max-w-sm p-3 text-grey-500">
                      <code className="break-words">
                        {value(difference.liveValue)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-13 text-grey-500">
            The submitted metadata matches the current live version.
          </p>
        )}
      </section>
    </div>
  );
};
