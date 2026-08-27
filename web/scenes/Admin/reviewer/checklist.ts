import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";

import type { ReviewerAppMode } from "./types";

export const REVIEW_CHECKLIST_VERSION = "2026-08-27.1";

export type ReviewChecklistDefinition = {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  conditional?: boolean;
};

const REVIEW_POLICY_URL = "https://docs.world.org/mini-apps/guidelines/policy";
const APP_GUIDELINES_URL =
  "https://docs.world.org/mini-apps/guidelines/app-guidelines";
const WORLD_ID_DOCS_URL = "https://docs.world.org/world-id";

const sharedDefinitions: readonly ReviewChecklistDefinition[] = [
  {
    id: "shared.metadata-accurate",
    title: "Accurate metadata",
    description:
      "The name, descriptions, category, screenshots, and links describe the submitted product.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "shared.production-ready",
    title: "Production readiness",
    description:
      "The submitted URL is live, stable, and does not rely on test credentials or placeholder content.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "shared.world-id-integration",
    title: "World ID integration",
    description:
      "The relevant IDKit or MiniKit flow completes and handles failure states without misleading users.",
    sourceUrl: WORLD_ID_DOCS_URL,
  },
  {
    id: "shared.safety",
    title: "User safety",
    description:
      "The app avoids deceptive behavior, unsafe financial claims, prohibited content, and abusive permissions.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "shared.privacy-legal",
    title: "Privacy and legal compliance",
    description:
      "Privacy, terms, consent, and regulated-product disclosures match the app's behavior and regions.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "shared.branding",
    title: "World branding",
    description:
      "World names, marks, and verification claims follow the published branding rules.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "shared.regional-availability",
    title: "Regional availability",
    description:
      "Configured countries match the service's legal and operational availability.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "shared.support-contact",
    title: "Support contact",
    description:
      "The support email or URL works and gives users a practical way to resolve problems.",
    sourceUrl: REVIEW_POLICY_URL,
  },
];

const miniAppDefinitions: readonly ReviewChecklistDefinition[] = [
  {
    id: "mini.review-policy",
    title: "Mini App review policy",
    description:
      "The complete submission follows the current World App review policy.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "mini.app-design",
    title: "App and design guidance",
    description:
      "Navigation, copy, touch targets, loading states, and visual hierarchy work inside World App.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "mini.mobile-reliability",
    title: "Mobile reliability",
    description:
      "Core flows work on supported mobile screen sizes, slow networks, and a World App webview.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "mini.listing-assets",
    title: "Listing assets",
    description:
      "Logo, content card, social image, and showcase images are legible, current, and correctly localized.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "mini.smart-contracts",
    title: "Smart contracts",
    description:
      "Submitted contracts and token permissions match user-facing behavior and have appropriate safeguards.",
    sourceUrl: REVIEW_POLICY_URL,
    conditional: true,
  },
  {
    id: "mini.notifications",
    title: "Notifications",
    description:
      "Notification purpose, frequency, and consent match the configured limits and user expectations.",
    sourceUrl: APP_GUIDELINES_URL,
    conditional: true,
  },
];

const externalDefinitions: readonly ReviewChecklistDefinition[] = [
  {
    id: "external.integration-url",
    title: "Integration URL",
    description:
      "The HTTPS integration URL is public, belongs to the submitted product, and opens without unsafe redirects.",
    sourceUrl: WORLD_ID_DOCS_URL,
  },
  {
    id: "external.relying-party-actions",
    title: "Relying party and actions",
    description:
      "Production relying-party and action configuration matches the integration's verification requests.",
    sourceUrl: WORLD_ID_DOCS_URL,
  },
  {
    id: "external.idkit-flow",
    title: "IDKit flow",
    description:
      "A reviewer can complete the production IDKit flow and observe correct success, cancellation, and error handling.",
    sourceUrl: WORLD_ID_DOCS_URL,
  },
  {
    id: "external.safety-legal",
    title: "Integration safety and legal requirements",
    description:
      "The surrounding product explains verification use and meets applicable safety, privacy, and legal requirements.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "external.ecosystem-metadata",
    title: "Ecosystem metadata",
    description:
      "Directory copy, links, regions, and assets accurately represent the external integration.",
    sourceUrl: REVIEW_POLICY_URL,
  },
];

const checklistConfigurations: Record<
  string,
  {
    shared: readonly ReviewChecklistDefinition[];
    miniApp: readonly ReviewChecklistDefinition[];
    external: readonly ReviewChecklistDefinition[];
  }
> = {
  [REVIEW_CHECKLIST_VERSION]: {
    shared: sharedDefinitions,
    miniApp: miniAppDefinitions,
    external: externalDefinitions,
  },
};

export const isReviewChecklistVersionSupported = (version: string) =>
  Object.hasOwn(checklistConfigurations, version);

export const getChecklistDefinitions = (
  mode: ReviewerAppMode,
  version = REVIEW_CHECKLIST_VERSION,
): ReviewChecklistDefinition[] => {
  const configuration = checklistConfigurations[version];
  if (!configuration) return [];
  return [
    ...configuration.shared,
    ...(mode === "mini-app" ? configuration.miniApp : configuration.external),
  ];
};

const duplicateIds = (items: ReviewChecklist["items"]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
};

export const validateChecklistDraft = (
  mode: ReviewerAppMode,
  checklist: ReviewChecklist,
  version = REVIEW_CHECKLIST_VERSION,
): string[] => {
  if (!isReviewChecklistVersionSupported(version)) {
    return [`Checklist version ${version} is not supported`];
  }
  const validIds = new Set(
    getChecklistDefinitions(mode, version).map(({ id }) => id),
  );
  const errors: string[] = [];

  for (const id of duplicateIds(checklist.items)) {
    errors.push(`${id} appears more than once`);
  }

  for (const item of checklist.items) {
    if (!validIds.has(item.id))
      errors.push(`${item.id} is not in this checklist`);
    if (item.status === "na" && !item.applicabilityNote?.trim()) {
      errors.push(`${item.id} requires an applicability note`);
    }
  }

  return errors;
};

export const getChecklistProgress = (
  mode: ReviewerAppMode,
  checklist: ReviewChecklist,
  version = REVIEW_CHECKLIST_VERSION,
) => {
  const definitions = getChecklistDefinitions(mode, version);
  const completedIds = new Set(
    checklist.items
      .filter(
        (item) =>
          item.status !== "na" || Boolean(item.applicabilityNote?.trim()),
      )
      .map(({ id }) => id),
  );
  const completed = definitions.filter(({ id }) => completedIds.has(id)).length;
  return {
    completed,
    total: definitions.length,
    percent: definitions.length
      ? Math.round((completed / definitions.length) * 100)
      : 0,
  };
};

export const validateApprovalChecklist = (
  mode: ReviewerAppMode,
  checklist: ReviewChecklist,
  overrideReason: string,
  version = REVIEW_CHECKLIST_VERSION,
): string[] => {
  const errors = validateChecklistDraft(mode, checklist, version);
  if (!isReviewChecklistVersionSupported(version)) return errors;
  const definitions = getChecklistDefinitions(mode, version);
  const resultsById = new Map(checklist.items.map((item) => [item.id, item]));
  const hasFailed = definitions.some(
    ({ id }) => resultsById.get(id)?.status === "fail",
  );
  const hasIncomplete = definitions.some(({ id }) => !resultsById.has(id));

  if ((hasFailed || hasIncomplete) && !overrideReason.trim()) {
    errors.push(
      "Override reason is required when checks fail or remain incomplete",
    );
  }

  return errors;
};
