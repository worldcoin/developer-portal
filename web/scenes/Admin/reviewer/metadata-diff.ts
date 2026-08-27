type SnapshotDifference = {
  field: string;
  draftValue: unknown;
  liveValue: unknown;
};

const metadataWorkflowFields = new Set([
  "app_id",
  "changelog",
  "created_at",
  "id",
  "is_developer_allow_listing",
  "is_reviewer_app_store_approved",
  "is_reviewer_world_app_approved",
  "is_row_verified",
  "review_message",
  "reviewed_by",
  "updated_at",
  "verification_status",
  "verified_at",
]);

const localizationIdentityFields = new Set([
  "app_metadata_id",
  "created_at",
  "id",
  "updated_at",
]);

const normalized = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalized(child)]),
    );
  }
  return value;
};

const differs = (left: unknown, right: unknown) =>
  JSON.stringify(normalized(left)) !== JSON.stringify(normalized(right));

const compareRecords = (
  prefix: string,
  draft: Record<string, unknown>,
  live: Record<string, unknown>,
  ignoredFields: ReadonlySet<string>,
): SnapshotDifference[] => {
  const fields = new Set([...Object.keys(draft), ...Object.keys(live)]);
  return [...fields]
    .sort()
    .filter((field) => !ignoredFields.has(field))
    .map((field) => ({
      field,
      draftValue: field in draft ? draft[field] : null,
      liveValue: field in live ? live[field] : null,
    }))
    .filter(({ draftValue, liveValue }) => differs(draftValue, liveValue))
    .map((field) => ({
      ...field,
      field: `${prefix}${field.field}`,
    }));
};

const localizationsByLocale = (localizations: Array<Record<string, unknown>>) =>
  new Map(
    localizations
      .filter(({ locale }) => typeof locale === "string")
      .map((localization) => [String(localization.locale), localization]),
  );

export const buildReviewerSnapshotDiff = ({
  metadataSnapshot,
  localizationsSnapshot,
  liveMetadata,
  liveLocalizations,
}: {
  metadataSnapshot: Record<string, unknown>;
  localizationsSnapshot: Array<Record<string, unknown>>;
  liveMetadata: Record<string, unknown> | null;
  liveLocalizations: Array<Record<string, unknown>>;
}): SnapshotDifference[] => {
  if (!liveMetadata) {
    return [
      {
        field: "publication",
        draftValue: "Submitted draft",
        liveValue: "No published version",
      },
    ];
  }

  const differences = compareRecords(
    "",
    metadataSnapshot,
    liveMetadata,
    metadataWorkflowFields,
  );
  const draftByLocale = localizationsByLocale(localizationsSnapshot);
  const liveByLocale = localizationsByLocale(liveLocalizations);
  const locales = new Set([...draftByLocale.keys(), ...liveByLocale.keys()]);

  for (const locale of [...locales].sort()) {
    differences.push(
      ...compareRecords(
        `localisations.${locale}.`,
        draftByLocale.get(locale) ?? {},
        liveByLocale.get(locale) ?? {},
        localizationIdentityFields,
      ),
    );
  }

  return differences;
};
