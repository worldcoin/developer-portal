/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";

const useFetchAppMetadataQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    useFetchAppMetadataQuery: (...a: unknown[]) =>
      useFetchAppMetadataQuery(...a),
  }),
);
const useGetActionsQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated",
  () => ({
    useGetActionsQuery: (...a: unknown[]) => useGetActionsQuery(...a),
  }),
);
import { useAppCapabilities } from "@/scenes/PortalV3/layout/Shell/use-app-capabilities";

beforeEach(() => jest.clearAllMocks());
const meta = (app_mode: string) => ({
  data: { app: [{ app_metadata: [{ app_mode }] }] },
  loading: false,
});
const actions = (n: number) => ({
  data: {
    actions: Array.from({ length: n }, (_, i) => ({ id: `action_${i}` })),
  },
  loading: false,
});

it("external app, no legacy actions → both capabilities off, loaded", () => {
  useFetchAppMetadataQuery.mockReturnValue(meta("external"));
  useGetActionsQuery.mockReturnValue(actions(0));
  const { result } = renderHook(() => useAppCapabilities("app_1"));
  expect(result.current).toEqual({
    isMiniApp: false,
    hasLegacyActions: false,
    loaded: true,
  });
});
it("mini-app with legacy actions → both on", () => {
  useFetchAppMetadataQuery.mockReturnValue(meta("mini-app"));
  useGetActionsQuery.mockReturnValue(actions(2));
  const { result } = renderHook(() => useAppCapabilities("app_1"));
  expect(result.current).toEqual({
    isMiniApp: true,
    hasLegacyActions: true,
    loaded: true,
  });
});
it("loading → loaded=false and capabilities off", () => {
  useFetchAppMetadataQuery.mockReturnValue({ data: undefined, loading: true });
  useGetActionsQuery.mockReturnValue(actions(0));
  const { result } = renderHook(() => useAppCapabilities("app_1"));
  expect(result.current.loaded).toBe(false);
});
it("no appId → skips queries, loaded=false", () => {
  useFetchAppMetadataQuery.mockReturnValue({ data: undefined, loading: false });
  useGetActionsQuery.mockReturnValue({ data: undefined, loading: false });
  const { result } = renderHook(() => useAppCapabilities(null));
  expect(result.current.loaded).toBe(false);
  expect(useFetchAppMetadataQuery).toHaveBeenCalledWith(
    expect.objectContaining({ skip: true }),
  );
});
