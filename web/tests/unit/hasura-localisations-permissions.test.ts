import { readFileSync } from "fs";
import path from "path";

// #region Test Data
const metadataPath = path.join(
  __dirname,
  "../../..",
  "hasura/metadata/databases/default/tables/public_localisations.yaml",
);

const metadata = readFileSync(metadataPath, "utf8");

const extractSection = (name: string) => {
  const start = metadata.indexOf(`${name}:`);

  if (start === -1) {
    throw new Error(`Missing ${name} section`);
  }

  const nextSection = metadata.indexOf("\n", start + name.length + 1);
  const nextTopLevel = metadata.slice(nextSection + 1).search(/^[a-z_]+:/m);

  if (nextTopLevel === -1) {
    return metadata.slice(start);
  }

  return metadata.slice(start, nextSection + 1 + nextTopLevel);
};

const extractUserPermission = (sectionName: string) => {
  const section = extractSection(sectionName);
  const start = section.indexOf("  - role: user");
  const nextRole = section.indexOf("\n  - role:", start + 1);

  if (start === -1) {
    throw new Error(`Missing user permission in ${sectionName}`);
  }

  return nextRole === -1
    ? section.slice(start)
    : section.slice(start, nextRole);
};
// #endregion

// #region Localisation review freeze
describe("localisations user permissions", () => {
  it("only allows user updates while parent app metadata is unverified", () => {
    const permission = extractUserPermission("update_permissions");

    expect(permission).toContain("filter:");
    expect(permission).toContain("check:");
    expect(
      permission.match(/verification_status:\n {16}_eq: unverified/g),
    ).toHaveLength(2);
    expect(permission).not.toContain("_neq: verified");
    expect(permission).not.toContain("awaiting_review");
  });

  it("only allows user deletes while parent app metadata is unverified", () => {
    const permission = extractUserPermission("delete_permissions");

    expect(permission).toContain("filter:");
    expect(
      permission.match(/verification_status:\n {16}_eq: unverified/g),
    ).toHaveLength(1);
    expect(permission).not.toContain("_neq: verified");
    expect(permission).not.toContain("awaiting_review");
  });
});
// #endregion
