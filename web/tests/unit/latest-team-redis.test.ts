// #region Mocks
const warn = jest.fn();
jest.mock("@/lib/logger", () => ({
  logger: { warn: (...args: unknown[]) => warn(...args) },
}));
// #endregion

import {
  getLatestTeamId,
  rememberLatestTeam,
} from "@/scenes/PortalV3/Dashboard/server/latest-team";

const redisGet = jest.fn();
const redisSet = jest.fn();
const originalRedis = global.RedisClient;

beforeEach(() => {
  jest.clearAllMocks();
  global.RedisClient = {
    get: (...args: unknown[]) => redisGet(...args),
    set: (...args: unknown[]) => redisSet(...args),
  } as typeof global.RedisClient;
});

afterAll(() => {
  global.RedisClient = originalRedis;
});

describe("latest team Redis preference", () => {
  it("stores and reads the team under the stable user key", async () => {
    redisGet.mockResolvedValue("team_2");
    redisSet.mockResolvedValue("OK");

    await expect(getLatestTeamId("user_1")).resolves.toBe("team_2");
    await rememberLatestTeam("user_1", "team_2");

    const key = "developer-portal:latest-team:v1:user_1";
    expect(redisGet).toHaveBeenCalledWith(key);
    expect(redisSet).toHaveBeenCalledWith(key, "team_2");
  });

  it("fails open when Redis is unavailable", async () => {
    global.RedisClient = undefined;

    await expect(getLatestTeamId("user_1")).resolves.toBeUndefined();
    await expect(
      rememberLatestTeam("user_1", "team_2"),
    ).resolves.toBeUndefined();
  });

  it("fails open and logs when Redis returns an error", async () => {
    redisGet.mockRejectedValue(new Error("Redis down"));
    redisSet.mockRejectedValue(new Error("Redis down"));

    await expect(getLatestTeamId("user_1")).resolves.toBeUndefined();
    await expect(
      rememberLatestTeam("user_1", "team_2"),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
