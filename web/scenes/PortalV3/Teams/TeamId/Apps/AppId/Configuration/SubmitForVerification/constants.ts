// Ordered steps for the "Submit for Verification" wizard. Each step id maps to a
// scene rendered by <VerificationWizard>. Keep this list as the single source of
// truth for both the <Stepper> and the render switch in index.tsx.
export const STEPS = [
  { id: "icon", label: "App icon" },
  { id: "showcase", label: "Showcase" },
  { id: "details", label: "Description" },
  { id: "urls", label: "App URL" },
  { id: "localization", label: "Localization" },
  { id: "publish", label: "Publish" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
