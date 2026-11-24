import { teamNameSchema } from "@/lib/schema";

// Pins the shared name contract between team creation (/api/create-team,
// onboarding + dialog forms) and team rename (settings). Any code that ever
// generates a team name instead of accepting user input must satisfy this
// same schema, or the rename form will reject the team's own current name.

const isValid = (value: string) => teamNameSchema.isValidSync(value);

// #region Accepted names
describe("teamNameSchema [accepted]", () => {
  it.each([
    ["plain words with spaces", "Platform Team"],
    ["digits", "Team 42"],
    ["accented letters", "Tools für Humanity"],
    ["CJK characters", "チーム 世界"],
    ["ampersand", "R&D"],
    ["dot", "john.doe"],
    ["plus", "staging+prod"],
    ["at sign", "team@world"],
    ["exactly 128 characters", "a".repeat(128)],
  ])("accepts %s", (_label, value) => {
    expect(isValid(value)).toBe(true);
  });
});
// #endregion

// #region Rejected names
describe("teamNameSchema [rejected]", () => {
  it.each([
    ["underscore (connector punctuation)", "john_doe"],
    ["hyphen (dash punctuation)", "my-team"],
    ["email local-part with underscore", "wrong_email+dev"],
    ["angle brackets", "<script>"],
    ["empty string", ""],
    ["129 characters", "a".repeat(129)],
  ])("rejects %s", (_label, value) => {
    expect(isValid(value)).toBe(false);
  });
});
// #endregion
