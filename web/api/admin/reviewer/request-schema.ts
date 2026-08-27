import { NextRequest } from "next/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClaimedWriteBody = {
  claimToken: string;
  expectedReviewVersion: number;
};

export type ChecklistItemStatus = "pass" | "fail" | "na";

export type ReviewChecklist = {
  items: Array<{
    id: string;
    status: ChecklistItemStatus;
    evidence: string;
    applicabilityNote?: string;
  }>;
  internalNotes: string;
};

export type ChecklistWriteBody = ClaimedWriteBody & {
  checklistVersion: string;
  checklist: ReviewChecklist;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
) => Object.keys(value).every((key) => expectedKeys.includes(key));

const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && typeof value === "number" && value > 0;

const isBoundedString = (
  value: unknown,
  maxLength: number,
  requireNonblank = false,
): value is string =>
  typeof value === "string" &&
  value.length <= maxLength &&
  (!requireNonblank || value.trim().length > 0);

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

const readJsonObject = async (
  req: NextRequest,
): Promise<Record<string, unknown> | null> => {
  try {
    const value: unknown = await req.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
};

export const readClaimBody = async (
  req: NextRequest,
): Promise<{ expectedReviewVersion: number } | null> => {
  const body = await readJsonObject(req);

  if (
    !body ||
    !hasOnlyKeys(body, ["expectedReviewVersion"]) ||
    !isPositiveInteger(body.expectedReviewVersion)
  ) {
    return null;
  }

  return { expectedReviewVersion: body.expectedReviewVersion };
};

export const readClaimedWriteBody = async (
  req: NextRequest,
): Promise<ClaimedWriteBody | null> => {
  const body = await readJsonObject(req);

  if (
    !body ||
    !hasOnlyKeys(body, ["claimToken", "expectedReviewVersion"]) ||
    typeof body.claimToken !== "string" ||
    !isUuid(body.claimToken) ||
    !isPositiveInteger(body.expectedReviewVersion)
  ) {
    return null;
  }

  return {
    claimToken: body.claimToken,
    expectedReviewVersion: body.expectedReviewVersion,
  };
};

const readChecklist = (value: unknown): ReviewChecklist | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["items", "internalNotes"]) ||
    !Array.isArray(value.items) ||
    !isBoundedString(value.internalNotes, 20_000)
  ) {
    return null;
  }

  const ids = new Set<string>();
  const items: ReviewChecklist["items"] = [];

  for (const rawItem of value.items) {
    if (
      !isRecord(rawItem) ||
      !hasOnlyKeys(rawItem, [
        "id",
        "status",
        "evidence",
        "applicabilityNote",
      ]) ||
      !isBoundedString(rawItem.id, 200, true) ||
      (rawItem.status !== "pass" &&
        rawItem.status !== "fail" &&
        rawItem.status !== "na") ||
      !isBoundedString(rawItem.evidence, 10_000) ||
      (rawItem.applicabilityNote !== undefined &&
        !isBoundedString(rawItem.applicabilityNote, 5_000)) ||
      (rawItem.status === "na" &&
        !isBoundedString(rawItem.applicabilityNote, 5_000, true))
    ) {
      return null;
    }

    const id = rawItem.id.trim();
    if (ids.has(id)) return null;
    ids.add(id);

    items.push({
      id,
      status: rawItem.status,
      evidence: rawItem.evidence,
      ...(rawItem.applicabilityNote === undefined
        ? {}
        : { applicabilityNote: rawItem.applicabilityNote }),
    });
  }

  return { items, internalNotes: value.internalNotes };
};

export const readChecklistWriteBody = async (
  req: NextRequest,
): Promise<ChecklistWriteBody | null> => {
  const body = await readJsonObject(req);

  if (
    !body ||
    !hasOnlyKeys(body, [
      "claimToken",
      "expectedReviewVersion",
      "checklistVersion",
      "checklist",
    ]) ||
    typeof body.claimToken !== "string" ||
    !isUuid(body.claimToken) ||
    !isPositiveInteger(body.expectedReviewVersion) ||
    !isBoundedString(body.checklistVersion, 100, true)
  ) {
    return null;
  }

  const checklist = readChecklist(body.checklist);
  if (!checklist) return null;

  return {
    claimToken: body.claimToken,
    expectedReviewVersion: body.expectedReviewVersion,
    checklistVersion: body.checklistVersion.trim(),
    checklist,
  };
};
