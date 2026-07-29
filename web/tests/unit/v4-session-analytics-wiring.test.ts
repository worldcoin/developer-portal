import { existsSync, readdirSync, readFileSync, type Dirent } from "fs";
import { join } from "path";

// #region Test Data
const repositoryRoot = join(process.cwd(), "..");
const marker = "session_tracking_started_at";

const findFiles = (
  directory: string,
  include: (entry: Dirent) => boolean,
): string[] => {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findFiles(path, include);
    return include(entry) ? [path] : [];
  });
};
// #endregion

// #region Cron wiring
describe("v4 session analytics deployment wiring", () => {
  it("schedules the protected prune route exactly once per night", () => {
    const metadata = readFileSync(
      join(repositoryRoot, "hasura/metadata/cron_triggers.yaml"),
      "utf8",
    );
    const matchingEntries = metadata
      .split(/\n(?=- name: )/)
      .filter((entry) =>
        entry.includes(
          "webhook: '{{NEXT_API_URL}}/_prune-session-verifications'",
        ),
      );

    expect(matchingEntries).toHaveLength(1);
    const entry = matchingEntries[0];
    expect(entry).toContain("include_in_metadata: true");
    expect(entry).toContain("value_from_env: INTERNAL_ENDPOINTS_SECRET");

    const schedule = entry.match(/schedule:\s*['"]?([^'"\n]+)['"]?/)?.[1];
    expect(schedule).toBeDefined();
    const [minute, hour, dayOfMonth, month, dayOfWeek] =
      schedule?.trim().split(/\s+/) ?? [];

    expect(Number(minute)).toBeGreaterThanOrEqual(0);
    expect(Number(minute)).toBeLessThanOrEqual(59);
    expect(Number(hour)).toBeGreaterThanOrEqual(0);
    expect(Number(hour)).toBeLessThanOrEqual(23);
    expect([dayOfMonth, month, dayOfWeek]).toEqual(["*", "*", "*"]);
  });
});
// #endregion

// #region Fleet-gated tracking marker
describe("v4 session analytics tracking marker", () => {
  it("is never seeded by a database migration", () => {
    const migrationFiles = findFiles(
      join(repositoryRoot, "hasura/migrations/default"),
      (entry) => entry.name === "up.sql",
    );
    const markerMigrations = migrationFiles.filter((file) =>
      readFileSync(file, "utf8").includes(marker),
    );

    expect(markerMigrations).toEqual([]);
  });
});
// #endregion
