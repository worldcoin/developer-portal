import { clearTableCaches } from "@/api/helpers/selfie-check-analytics/snapshots";
import { source, totalsCsv, userId } from "./selfie-check-analytics";

// Shared I/O boundaries for the real server component/eligibility logic.
export const listCsv = jest.fn();
export const downloadCsv = jest.fn();
export const getSession = jest.fn();
export const GetIsUserPermittedToReadApp = jest.fn();

jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  listCsv: (...args: unknown[]) => listCsv(...args),
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));
jest.mock("@auth0/nextjs-auth0", () => ({ useUser: jest.fn() }));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
jest.mock(
  "@/lib/permissions/graphql/server/get-app-read-permissions.generated",
  () => ({
    getSdk: () => ({
      GetIsUserPermittedToReadApp: (...args: unknown[]) =>
        GetIsUserPermittedToReadApp(...args),
    }),
  }),
);
jest.mock("@/lib/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  clearTableCaches();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-26T22:00:00Z"));
  listCsv.mockResolvedValue(source());
  downloadCsv.mockResolvedValue({ object: source(), csv: totalsCsv() });
  getSession.mockResolvedValue({ user: { hasura: { id: userId } } });
  GetIsUserPermittedToReadApp.mockResolvedValue({
    app_by_pk: { team: { memberships: [{ id: "membership" }] } },
  });
});
afterEach(() => jest.useRealTimers());
