/**
 * @jest-environment jsdom
 */
// #region Mocks
jest.mock("server-only", () => ({}));

const isPortalV3Enabled = jest.fn<boolean, []>();
jest.mock("@/lib/feature-flags/portal-v3/flag", () => ({
  isPortalV3Enabled: () => isPortalV3Enabled(),
}));
// #endregion

import { pickPortalComponent } from "@/lib/feature-flags/portal-v3/render-portal-scene";

type Props = { label: string };
const V2 = ({ label }: Props) => <div data-testid="v2">{`v2:${label}`}</div>;
const V3 = ({ label }: Props) => <div data-testid="v3">{`v3:${label}`}</div>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pickPortalComponent", () => {
  it("returns V2 when the flag is off", () => {
    isPortalV3Enabled.mockReturnValue(false);
    expect(pickPortalComponent(V2, V3)).toBe(V2);
  });

  it("returns V3 when the flag is on and a V3 component exists", () => {
    isPortalV3Enabled.mockReturnValue(true);
    expect(pickPortalComponent(V2, V3)).toBe(V3);
  });

  it("returns V2 when the flag is on but V3 is null (compat case)", () => {
    isPortalV3Enabled.mockReturnValue(true);
    expect(pickPortalComponent(V2, null)).toBe(V2);
  });
});
