import { schema } from "@/api/v4/verify/request-schema";

describe("v4 verify request schema", () => {
  const integrityBundle = {
    version: 1,
    signature_format: "android_keystore",
    timestamp: 1772638272,
    signature: "abcd",
    jwt: "a.b.c",
  };

  it("applies default signal_hash for v4 uniqueness responses", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.responses[0]?.signal_hash).toBe("0x0");
  });

  it('accepts "selfie" as a v3 response identifier', async () => {
    const parsed = await schema.validate({
      protocol_version: "3.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "selfie",
          merkle_root: "0x01",
          nullifier: "0x02",
          proof: "0x03",
        },
      ],
    });

    expect(parsed.responses[0]?.identifier).toBe("selfie");
  });

  it("preserves min_protocol_version after schema validation", async () => {
    const parsed = await schema.validate({
      protocol_version: "3.0",
      min_protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "orb",
          merkle_root: "0x01",
          nullifier: "0x02",
          proof: "0x03",
        },
      ],
    });

    expect(parsed.min_protocol_version).toBe("4.0");
  });

  it("rejects an unsupported min_protocol_version", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        min_protocol_version: "5.0",
        nonce: "0x01",
        action: "test-action",
        responses: [
          {
            identifier: "proof_of_human",
            issuer_schema_id: 1,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("rejects a session proof that declares protocol_version 3.0", async () => {
    await expect(
      schema.validate({
        protocol_version: "3.0",
        nonce: "0x01",
        session_id: "session_test",
        responses: [
          {
            identifier: "orb",
            merkle_root: "0x01",
            nullifier: "0x02",
            proof: "0x03",
          },
        ],
      }),
    ).rejects.toThrow("session proofs require protocol_version 4.0");
  });

  it("accepts a session proof on protocol_version 4.0", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      session_id: "session_test",
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          session_nullifier: ["0x01", "0x02"],
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.session_id).toBe("session_test");
  });

  it('preserves the "sandbox" environment after schema validation', async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      environment: "sandbox",
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.environment).toBe("sandbox");
  });

  it("accepts optional top-level integrity_bundle", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      integrity_bundle: integrityBundle,
      responses: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: 1,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.integrity_bundle).toEqual(integrityBundle);
  });

  it("rejects string integrity_bundle values", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        integrity_bundle:
          "v=1,sf=android_keystore,t=1772638272,s=abcd,jwt=a.b.c",
        responses: [
          {
            identifier: "proof_of_human",
            issuer_schema_id: 1,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("rejects oversized integrity_bundle values", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        integrity_bundle: {
          ...integrityBundle,
          jwt: "x".repeat(8193),
        },
        responses: [
          {
            identifier: "proof_of_human",
            issuer_schema_id: 1,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("requires the signed sybil_score for Self Check 4.0 responses", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      integrity_bundle: { ...integrityBundle, version: 2 },
      responses: [
        {
          identifier: "selfie",
          issuer_schema_id: 11,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          sybil_score: 10,
        },
      ],
    });

    expect(parsed.responses[0]?.sybil_score).toBe(10);
  });

  it("rejects a Self Check 4.0 response without sybil_score", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        responses: [
          {
            identifier: "selfie",
            issuer_schema_id: 11,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow("sybil_score is required for Self Check 4.0 responses");
  });
});

// #region Supported v4 credential issuers
describe.each(["uniqueness", "session"])(
  "%s credential issuer validation",
  (flow) => {
    const makeRequest = (identifier: string, issuerSchemaId: number) => ({
      protocol_version: "4.0",
      nonce: "0x01",
      ...(flow === "session"
        ? { session_id: "session_test" }
        : { action: "test-action" }),
      responses: [
        {
          identifier,
          issuer_schema_id: issuerSchemaId,
          ...(flow === "session"
            ? { session_nullifier: ["0x01", "0x02"] }
            : { nullifier: "0x02" }),
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          ...(issuerSchemaId === 11 ? { sybil_score: 10 } : {}),
        },
      ],
    });

    it.each<[string, number]>([
      ["proof_of_human", 1],
      ["selfie", 11],
      ["face", 11],
      ["passport", 9303],
      ["mnc", 9310],
    ])(
      "accepts %s with issuer %i without rewriting it",
      async (identifier, issuer) => {
        const request = makeRequest(identifier, issuer);
        const parsed = await schema.validate(request);

        expect(parsed.responses[0]).toMatchObject(request.responses[0]);
      },
    );

    it.each<[string, number]>([
      ["proof_of_human", 9303],
      ["selfie", 1],
      ["face", 1],
      ["passport", 9310],
      ["mnc", 9303],
      ["proof_of_human", 99999],
      ["custom", 1],
    ])("rejects %s with issuer %i", async (identifier, issuer) => {
      await expect(
        schema.validate(makeRequest(identifier, issuer)),
      ).rejects.toThrow(
        "issuer_schema_id does not match a supported credential identifier",
      );
    });

    it.each(["staging", "sandbox"])(
      "accepts faux proof_of_human only on the %s verifier",
      async (environment) => {
        const parsed = await schema.validate({
          ...makeRequest("proof_of_human", 128),
          environment,
        });

        expect(parsed.responses[0]).toMatchObject({
          identifier: "proof_of_human",
          issuer_schema_id: 128,
        });
      },
    );

    it.each([undefined, "production"])(
      "rejects the faux issuer with environment %s",
      async (environment) => {
        await expect(
          schema.validate({
            ...makeRequest("proof_of_human", 128),
            environment,
          }),
        ).rejects.toThrow(
          "issuer_schema_id does not match a supported credential identifier",
        );
      },
    );

    it("rejects faux credentials labeled as another credential in staging", async () => {
      await expect(
        schema.validate({
          ...makeRequest("passport", 128),
          environment: "staging",
        }),
      ).rejects.toThrow(
        "issuer_schema_id does not match a supported credential identifier",
      );
    });

    it("checks every response in a batch", async () => {
      const request = makeRequest("proof_of_human", 1);
      request.responses.push(makeRequest("proof_of_human", 9303).responses[0]);

      await expect(schema.validate(request)).rejects.toMatchObject({
        path: "responses[1]",
      });
    });
  },
);
// #endregion
