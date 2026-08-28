const processLogoImage = jest.fn().mockResolvedValue(undefined);
const processContentCardImage = jest.fn().mockResolvedValue(undefined);
const registerPreparedPlan = jest.fn().mockResolvedValue(undefined);

jest.mock("@/api/helpers/image-processing", () => ({
  processLogoImage: (...args: unknown[]) => processLogoImage(...args),
  processContentCardImage: (...args: unknown[]) =>
    processContentCardImage(...args),
}));

import {
  collectVerifiedReviewerAssetKeys,
  deletePreparedReviewerAssets,
  expireVerifiedReviewerAssets,
  prepareReviewerDecisionAssets,
} from "@/api/helpers/reviewer-decision-assets";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  PutObjectTaggingCommand,
  type S3Client,
} from "@aws-sdk/client-s3";

const send = jest.fn().mockResolvedValue({});
const client = { send } as unknown as S3Client;

const metadataSnapshot = {
  logo_img_url: "logo_img.png",
  meta_tag_image_url: "meta_tag_image.jpg",
  content_card_image_url: "content_card_image.png",
  showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.jpg"],
};

const localizationsSnapshot = [
  {
    id: "localisation_es",
    locale: "es",
    meta_tag_image_url: "meta_tag_image.jpg",
    showcase_img_urls: ["showcase_img_1.png"],
  },
];

const snapshotPrefix =
  "review-submissions/app_123/meta_123/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/";
const assetSnapshot = {
  version: 1,
  prefix: snapshotPrefix,
  objects: {
    "unverified/app_123/logo_img.png": `${snapshotPrefix}logo_img.png`,
    "unverified/app_123/meta_tag_image.jpg": `${snapshotPrefix}meta_tag_image.jpg`,
    "unverified/app_123/content_card_image.png": `${snapshotPrefix}content_card_image.png`,
    "unverified/app_123/showcase_img_1.png": `${snapshotPrefix}showcase_img_1.png`,
    "unverified/app_123/showcase_img_2.jpg": `${snapshotPrefix}showcase_img_2.jpg`,
    "unverified/app_123/es/meta_tag_image.jpg": `${snapshotPrefix}es/meta_tag_image.jpg`,
    "unverified/app_123/es/showcase_img_1.png": `${snapshotPrefix}es/showcase_img_1.png`,
  },
};

describe("review decision assets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({});
    processLogoImage.mockResolvedValue(undefined);
    processContentCardImage.mockResolvedValue(undefined);
    registerPreparedPlan.mockResolvedValue(undefined);
  });

  it("registers an operation-unique metadata-versioned plan before S3 writes", async () => {
    const result = await prepareReviewerDecisionAssets({
      appId: "app_123",
      appMetadataId: "meta_123",
      operationId: "a".repeat(24),
      assetSnapshot,
      metadataSnapshot,
      localizationsSnapshot,
      registerPreparedPlan,
      s3Client: client,
      bucketName: "assets",
    });

    expect(result.metadataAssets).toEqual({
      logoImgUrl: `review_meta_123_${"a".repeat(24)}_logo.png`,
      metaTagImageUrl: `review_meta_123_${"a".repeat(24)}_meta.jpg`,
      contentCardImageUrl: `review_meta_123_${"a".repeat(24)}_content.png`,
      showcaseImgUrls: [
        `review_meta_123_${"a".repeat(24)}_showcase_1.png`,
        `review_meta_123_${"a".repeat(24)}_showcase_2.jpg`,
      ],
    });
    expect(result.localizationAssets).toEqual({
      localisation_es: {
        metaTagImageUrl: `review_meta_123_${"a".repeat(24)}_localisation_es_meta.jpg`,
        showcaseImgUrls: [
          `review_meta_123_${"a".repeat(24)}_localisation_es_showcase_1.png`,
        ],
      },
    });
    expect(result.preparedKeys).toEqual(
      expect.arrayContaining([
        `verified/app_123/review_meta_123_${"a".repeat(24)}_logo.png`,
        `verified/app_123/review_meta_123_${"a".repeat(24)}_logo_original.png`,
        `verified/app_123/review_meta_123_${"a".repeat(24)}_logo_rounded.png`,
        `verified/app_123/es/review_meta_123_${"a".repeat(24)}_localisation_es_meta.jpg`,
      ]),
    );
    expect(registerPreparedPlan).toHaveBeenCalledWith(result.preparedKeys);
    expect(registerPreparedPlan.mock.invocationCallOrder[0]).toBeLessThan(
      processLogoImage.mock.invocationCallOrder[0],
    );
    expect(processLogoImage).toHaveBeenCalledWith(
      client,
      "assets",
      `${snapshotPrefix}logo_img.png`,
      "verified/app_123/",
      `review_meta_123_${"a".repeat(24)}_logo`,
      400,
      400,
      30,
      100,
      "png",
    );
    expect(processContentCardImage).toHaveBeenCalledWith(
      client,
      "assets",
      `${snapshotPrefix}content_card_image.png`,
      `verified/app_123/review_meta_123_${"a".repeat(24)}_content.png`,
      "png",
    );
    const copies = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof CopyObjectCommand);
    expect(copies).toHaveLength(5);
  });

  it.each([
    ["path traversal", { ...metadataSnapshot, logo_img_url: "../logo.png" }],
    ["absolute key", { ...metadataSnapshot, logo_img_url: "/logo.png" }],
    [
      "unsupported extension",
      { ...metadataSnapshot, logo_img_url: "logo.svg" },
    ],
  ])("rejects unsafe source filenames: %s", async (_label, snapshot) => {
    await expect(
      prepareReviewerDecisionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        operationId: "b".repeat(24),
        assetSnapshot,
        metadataSnapshot: snapshot,
        localizationsSnapshot,
        registerPreparedPlan,
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("asset");
    expect(send).not.toHaveBeenCalled();
    expect(processLogoImage).not.toHaveBeenCalled();
  });

  it("rejects unsafe localization identifiers before S3 writes", async () => {
    await expect(
      prepareReviewerDecisionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        operationId: "b".repeat(24),
        assetSnapshot,
        metadataSnapshot,
        localizationsSnapshot: [
          { ...localizationsSnapshot[0], locale: "../es" },
        ],
        registerPreparedPlan,
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("locale");
    expect(send).not.toHaveBeenCalled();
  });

  it("normalizes jpeg destinations to jpg and enforces three showcases", async () => {
    const result = await prepareReviewerDecisionAssets({
      appId: "app_123",
      appMetadataId: "meta_123",
      operationId: "c".repeat(24),
      assetSnapshot: {
        ...assetSnapshot,
        objects: {
          ...assetSnapshot.objects,
          "unverified/app_123/logo_img.jpeg": `${snapshotPrefix}logo_img.jpeg`,
          "unverified/app_123/meta_tag_image.jpeg": `${snapshotPrefix}meta_tag_image.jpeg`,
        },
      },
      metadataSnapshot: {
        ...metadataSnapshot,
        logo_img_url: "logo_img.jpeg",
        meta_tag_image_url: "meta_tag_image.jpeg",
      },
      localizationsSnapshot: [],
      registerPreparedPlan,
      s3Client: client,
      bucketName: "assets",
    });

    expect(result.metadataAssets.logoImgUrl).toMatch(/_logo\.jpg$/);
    expect(result.metadataAssets.metaTagImageUrl).toMatch(/_meta\.jpg$/);
    expect(processLogoImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      `${snapshotPrefix}logo_img.jpeg`,
      expect.anything(),
      expect.anything(),
      400,
      400,
      30,
      100,
      "jpg",
    );

    await expect(
      prepareReviewerDecisionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        operationId: "d".repeat(24),
        assetSnapshot,
        metadataSnapshot: {
          ...metadataSnapshot,
          showcase_img_urls: ["one.png", "two.png", "three.png", "four.png"],
        },
        localizationsSnapshot: [],
        registerPreparedPlan,
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("showcase");
  });

  it("waits for partial preparation to settle and deletes the complete key plan", async () => {
    let failed = false;
    send.mockImplementation(async (command) => {
      if (command instanceof CopyObjectCommand && !failed) {
        failed = true;
        throw new Error("copy failed");
      }
      return {};
    });

    await expect(
      prepareReviewerDecisionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        operationId: "e".repeat(24),
        assetSnapshot,
        metadataSnapshot,
        localizationsSnapshot,
        registerPreparedPlan,
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("copy failed");

    const cleanup = send.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof DeleteObjectsCommand);
    expect(cleanup).toBeDefined();
    expect(cleanup?.input.Delete?.Objects).toEqual(
      expect.arrayContaining([
        {
          Key: `verified/app_123/review_meta_123_${"e".repeat(24)}_logo.png`,
        },
        {
          Key: `verified/app_123/es/review_meta_123_${"e".repeat(24)}_localisation_es_meta.jpg`,
        },
      ]),
    );
  });

  it("cleans the operation plan when an S3 client throws synchronously", async () => {
    let firstWrite = true;
    send.mockImplementation((command) => {
      if (command instanceof CopyObjectCommand && firstWrite) {
        firstWrite = false;
        throw new Error("synchronous copy failure");
      }
      return Promise.resolve({});
    });

    await expect(
      prepareReviewerDecisionAssets({
        appId: "app_123",
        appMetadataId: "meta_123",
        operationId: "f".repeat(24),
        assetSnapshot,
        metadataSnapshot,
        localizationsSnapshot,
        registerPreparedPlan,
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toThrow("synchronous copy failure");

    expect(
      send.mock.calls
        .map(([command]) => command)
        .some((command) => command instanceof DeleteObjectsCommand),
    ).toBe(true);
  });

  it("deletes only the tracked prepared keys in bounded batches", async () => {
    const keys = Array.from({ length: 1001 }, (_, index) => `key-${index}`);

    await deletePreparedReviewerAssets({
      keys,
      s3Client: client,
      bucketName: "assets",
    });

    const commands = send.mock.calls.map(([command]) => command);
    expect(commands).toHaveLength(2);
    expect(
      commands.every((command) => command instanceof DeleteObjectsCommand),
    ).toBe(true);
    expect(commands[0].input.Delete.Objects).toHaveLength(1000);
    expect(commands[1].input.Delete.Objects).toHaveLength(1);
  });

  it("surfaces per-key S3 deletion failures with their exact keys", async () => {
    send.mockResolvedValueOnce({
      Errors: [{ Key: "failed-key", Code: "InternalError" }],
    });

    await expect(
      deletePreparedReviewerAssets({
        keys: ["deleted-key", "failed-key"],
        s3Client: client,
        bucketName: "assets",
      }),
    ).rejects.toMatchObject({ failedKeys: ["failed-key"] });
  });

  it("passes the worker deadline to prepared deletion and live expiry requests", async () => {
    const abortSignal = AbortSignal.timeout(15_000);

    await deletePreparedReviewerAssets({
      keys: ["verified/app_123/prepared.png"],
      abortSignal,
      s3Client: client,
      bucketName: "assets",
    });
    await expireVerifiedReviewerAssets({
      keys: ["verified/app_123/old.png"],
      abortSignal,
      s3Client: client,
      bucketName: "assets",
    });

    expect(send).toHaveBeenCalledWith(expect.any(DeleteObjectsCommand), {
      abortSignal,
    });
    expect(send).toHaveBeenCalledWith(expect.any(PutObjectTaggingCommand), {
      abortSignal,
    });
  });

  it("collects exact prior live references without listing a shared prefix", () => {
    expect(
      collectVerifiedReviewerAssetKeys({
        appId: "app_123",
        metadata: {
          logo_img_url: "old-logo.png",
          hero_image_url: "old-hero.jpg",
          meta_tag_image_url: "old-meta.jpg",
          content_card_image_url: "",
          showcase_img_urls: ["old-showcase.png"],
          localisations: [
            {
              locale: "fr",
              hero_image_url: "old-local-hero.jpg",
              meta_tag_image_url: "old-local-meta.jpg",
              showcase_img_urls: ["old-local-showcase.png"],
            },
          ],
        },
      }),
    ).toEqual([
      "verified/app_123/old-logo.png",
      "verified/app_123/old-logo_original.png",
      "verified/app_123/old-logo_rounded.png",
      "verified/app_123/old-hero.jpg",
      "verified/app_123/old-meta.jpg",
      "verified/app_123/old-showcase.png",
      "verified/app_123/fr/old-local-hero.jpg",
      "verified/app_123/fr/old-local-meta.jpg",
      "verified/app_123/fr/old-local-showcase.png",
    ]);
  });
});
