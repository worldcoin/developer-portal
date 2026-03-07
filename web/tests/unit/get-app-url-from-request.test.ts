import { getAppUrlFromRequest } from "@/api/helpers/utils";
import { NextRequest } from "next/server";

describe("getAppUrlFromRequest()", () => {
  afterEach(() => {
    global.ParameterStore = undefined;
  });

  it("returns https when x-forwarded-proto header is absent and host is in allowedHosts", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue(["developer.world.org"]),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const mockReq = {
      headers: { get: jest.fn().mockReturnValue(null) },
      nextUrl: new URL("/api/test", "http://developer.world.org"),
    } as unknown as NextRequest;

    const result = await getAppUrlFromRequest(mockReq);

    expect(result).toBe("https://developer.world.org");
  });

  it("strips :80 from host and returns https when host is in allowedHosts", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue(["developer.world.org"]),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const mockReq = {
      headers: { get: jest.fn().mockReturnValue(null) },
      nextUrl: new URL("/api/test", "http://developer.world.org:80"),
    } as unknown as NextRequest;

    const result = await getAppUrlFromRequest(mockReq);

    expect(result).toBe("https://developer.world.org");
  });

  it("strips :80 from x-forwarded-host and returns https when host is in allowedHosts", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue(["developer.world.org"]),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const mockReq = {
      headers: {
        get: jest
          .fn()
          .mockImplementation((header: string) =>
            header === "x-forwarded-host" ? "developer.world.org:80" : null,
          ),
      },
      nextUrl: new URL("/api/test", "http://developer.world.org"),
    } as unknown as NextRequest;

    const result = await getAppUrlFromRequest(mockReq);

    expect(result).toBe("https://developer.world.org");
  });

  it("strips :443 from host and returns https when host is in allowedHosts", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue(["developer.world.org"]),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const mockReq = {
      headers: { get: jest.fn().mockReturnValue(null) },
      nextUrl: new URL("/api/test", "https://developer.world.org:443"),
    } as unknown as NextRequest;

    const result = await getAppUrlFromRequest(mockReq);

    expect(result).toBe("https://developer.world.org");
  });

  it("falls back to NEXT_PUBLIC_APP_URL when host is not in allowedHosts", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue([]),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const mockReq = {
      headers: { get: jest.fn().mockReturnValue(null) },
      nextUrl: new URL("/api/test", "http://localhost:3000"),
    } as unknown as NextRequest;

    const result = await getAppUrlFromRequest(mockReq);

    expect(result).toBe(
      process.env.NEXT_PUBLIC_APP_URL ?? "https://developer.world.org",
    );
  });
});
