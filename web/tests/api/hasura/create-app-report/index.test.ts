import { schema } from "@/api/hasura/create-app-report";
import {
  IllegalContentCategoryEnum,
  PurposeEnum,
  ViolationEnum,
} from "@/graphql/graphql";

describe("create-app-report schema validation [illegal-content]", () => {
  const validInput = {
    app_id: "app_a8fb422028b239a336fd065511294c47",
    user_id: "usr_0f21d289d476394c693700d75cf9aa60",
    reporter_email: "reporter2@example.com",
    purpose: PurposeEnum.IllegalContent,
    illegal_content_category: IllegalContentCategoryEnum.IllegalHateSpeech,
    illegal_content_description:
      "Contains hate speech against a specific group",
    illegal_content_location: "description explaining illegal-content-location",
  };

  it("should validate a valid input", async () => {
    await expect(schema.validate(validInput)).resolves.toBe(validInput);
  });

  it("should fail when required fields are missing", async () => {
    const invalidInput = { ...validInput, app_id: undefined };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when purpose is invalid", async () => {
    const invalidInput = { ...validInput, purpose: "INVALID_PURPOSE" };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when violation is missing for TOS_VIOLATION purpose", async () => {
    const invalidInput = {
      ...validInput,
      details: "details",
      purpose: PurposeEnum.TosViolation,
      violation: undefined,
    };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when violation is missing for TOS_VIOLATION purpose", async () => {
    const invalidInput = {
      ...validInput,
      details: "details",
      purpose: PurposeEnum.TosViolation,
      violation: undefined,
    };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when details are missing for TOS_VIOLATION purpose", async () => {
    const invalidInput = {
      ...validInput,
      purpose: PurposeEnum.TosViolation,
      details: undefined,
    };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when illegal_content_category is missing for ILLEGAL_CONTENT purpose", async () => {
    const invalidInput = { ...validInput, illegal_content_category: undefined };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when illegal_content_description is missing for ILLEGAL_CONTENT purpose", async () => {
    const invalidInput = {
      ...validInput,
      illegal_content_description: undefined,
    };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when illegal_content_location is missing for ILLEGAL_CONTENT purpose", async () => {
    const invalidInput = { ...validInput, illegal_content_location: undefined };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });
});

describe("create-app-report schema validation [other/tos-violation]", () => {
  const validInput = {
    app_id: "app_a8fb422028b239a336fd065511294c47",
    user_id: "usr_0f21d289d476394c693700d75cf9aa60",
    reporter_email: "reporter2@example.com",
    purpose: PurposeEnum.Other,
    violation: ViolationEnum.MaliciousApp,
    details: "details",
  };

  it("should validate a valid input", async () => {
    expect(schema.validate(validInput));
  });

  it("should validate when illegal content fields are provided", async () => {
    expect(
      schema.validate({
        ...validInput,
        illegal_content_category: IllegalContentCategoryEnum.IllegalHateSpeech,
        illegal_content_description:
          "Contains hate speech against a specific group",
        illegal_content_location:
          "description explaining illegal-content-location",
      }),
    );
  });

  it("should validate when illegal_content_category is defined for Other purpose", async () => {
    const invalidInput = {
      ...validInput,
      illegal_content_category: IllegalContentCategoryEnum.IllegalHateSpeech,
    };
    await expect(schema.validate(invalidInput));
  });

  it("should fail when required fields are missing", async () => {
    const invalidInput = { ...validInput, app_id: undefined };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when purpose is invalid", async () => {
    const invalidInput = { ...validInput, purpose: "INVALID_PURPOSE" };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when purpose is missing", async () => {
    const invalidInput = { ...validInput, purpose: null };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });

  it("should fail when violation is missing for TOS_VIOLATION purpose", async () => {
    const invalidInput = {
      ...validInput,
      details: "details",
      purpose: PurposeEnum.TosViolation,
      violation: undefined,
    };
    await expect(schema.validate(invalidInput)).rejects.toThrow();
  });
});
