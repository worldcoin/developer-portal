import { processUniquenessProofV3 } from "@/api/v4/verify/uniqueness-proof/verify-v3";
import { FACE_SEQUENCER } from "@/lib/constants";
import { semaphoreProofParamsMock } from "../__mocks__/proof.mock";

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("v4 verify v3-proof compatibility", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["face", "selfie"] as const)(
    'routes the "%s" identifier to the legacy face sequencer',
    async (identifier) => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify({ valid: true }), { status: 200 }),
        );

      const result = await processUniquenessProofV3(
        "app_0123456789abcdef0123456789abcdef",
        "test-action",
        [
          {
            identifier,
            signal_hash: semaphoreProofParamsMock.signal_hash,
            merkle_root: semaphoreProofParamsMock.merkle_root,
            nullifier: semaphoreProofParamsMock.nullifier_hash,
            proof: semaphoreProofParamsMock.proof,
          },
        ],
        false,
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        `${FACE_SEQUENCER}/v2/semaphore-proof/verify`,
        expect.objectContaining({ method: "POST" }),
      );
      expect(result).toEqual([
        {
          identifier,
          success: true,
          nullifier: semaphoreProofParamsMock.nullifier_hash,
        },
      ]);
    },
  );
});
