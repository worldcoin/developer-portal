#!/usr/bin/env npx tsx

/**
 * Fetch, normalize, and re-host the app icons used by BasePixelStrip's icon
 * reveal (web/scenes/Onboarding/Home/components/BasePixelStrip).
 *
 * Today icon-manifest.ts hotlinks whatever the app submitted to
 * world-id-assets.com directly - mixed formats, arbitrary aspect ratios, no
 * padding convention. At the reveal's peak ~10x zoom any inconsistency there
 * (low-res source, off-center crop, a sliver of transparency) reads as
 * broken. This script produces a consistent, pre-sized asset per app instead.
 *
 * Usage:
 *   npx tsx scripts/normalize-app-icons.ts                  # dry run: fetch + normalize + write locally only
 *   npx tsx scripts/normalize-app-icons.ts --upload          # also upload to S3 (needs ASSETS_S3_REGION / ASSETS_S3_BUCKET_NAME)
 *   npx tsx scripts/normalize-app-icons.ts --upload --write-manifest --cdn-base-url https://cdn.example.com
 *                                                             # upload, then rewrite icon-manifest.ts's APPS to point at the CDN
 *   npx tsx scripts/normalize-app-icons.ts --limit 10        # process only the first N apps (fast local iteration)
 *
 *   npx tsx scripts/normalize-app-icons.ts --refresh-existing --upload --write-manifest
 *                                                             # ONGOING MAINTENANCE MODE. Re-fetches fresh bytes for the
 *                                                             # apps already in icon-manifest.ts's APPS (by appId, from
 *                                                             # their live world-id-assets.com URL, in case the app
 *                                                             # owner updated their icon), then patches APPS in place.
 *                                                             # Never adds/removes/reorders entries, so
 *                                                             # CELL_APP_INDICES (which references APPS by numeric
 *                                                             # index) stays valid. Adding newly-popular apps into the
 *                                                             # grid rotation is a separate, harder problem - it needs
 *                                                             # re-running the cell placement algorithm that keeps
 *                                                             # duplicate icons >= 2*ICON_REVEAL_RADIUS apart - and
 *                                                             # isn't handled by this flag. Uploads are
 *                                                             # content-addressed and never overwrite a live object,
 *                                                             # so nothing serves the new bytes until the manifest
 *                                                             # change is reviewed and merged - see iconKeyFor below.
 *
 * Output (dry run): scripts/output/icons/<appId>.webp + scripts/output/icons/summary.json
 */

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { APPS as EXISTING_APPS } from "../scenes/Onboarding/Home/components/BasePixelStrip/icon-manifest";

const execFileAsync = promisify(execFile);

const RANKINGS_URL = "https://world-id-assets.com/api/v2/public/apps";
const ICON_SIZE = 256;
const WEBP_QUALITY = 82;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_ICON_BYTES = 5 * 1024 * 1024;
const S3_PREFIX = "pixel-strip-icons";

const OUTPUT_DIR = path.join(__dirname, "output", "icons");

// app_id ultimately flows into local file paths and S3 object keys below.
// It's normally a stable, code-generated identifier (e.g. "app_<32 hex>"),
// but it's still data from an external API response, not something we
// control - reject anything that isn't a plain identifier before it
// touches a path, rather than trusting the rankings API's shape blindly.
const SAFE_APP_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Object keys are content-addressed - the app id plus a hash of the exact
// bytes being stored - so an object is only ever created, never rewritten
// with different content. That's what makes the unattended weekly refresh
// (see .github/workflows/refresh-pixel-strip-icons.yml) safe:
//   - New bytes land under a key nothing references yet, so a corrupt or
//     hijacked upstream icon cannot reach the live grid until the manifest
//     PR that points at that key is reviewed and merged.
//   - The manifest URL changes whenever the bytes change, so that PR always
//     carries a visible diff. Overwriting a stable key produced no diff at
//     all, which made the "a human reviews it first" gate vacuous.
//   - Reverting that PR is a complete rollback: the previous key is still
//     there, untouched, serving the previous bytes.
//   - The one-year `immutable` Cache-Control below becomes truthful. On a
//     stable key it was actively harmful: caches would keep serving the old
//     bytes anyway, so the overwrite carried all the risk and none of the
//     effect.
// Note that this hashes the NORMALIZED output, so a sharp/libvips upgrade
// that re-encodes the same source differently will legitimately rotate every
// key at once. That's the one expected cause of a mass manifest diff other
// than a broken upstream response.
const ICON_DIGEST_LENGTH = 16;
const iconKeyFor = (appId: string, digest: string) =>
  `${S3_PREFIX}/${appId}-${digest}.webp`;

type RankedApp = {
  app_id: string;
  name: string;
  logo_img_url: string;
};

type RankingsResponse = {
  app_rankings: {
    top_apps: RankedApp[];
    highlights?: RankedApp[];
  };
};

type NormalizedIcon = {
  appId: string;
  name: string;
  sourceUrl: string;
  outputPath: string;
  digest: string;
  s3Key: string;
  bytes: number;
};

const args = process.argv.slice(2);
const shouldUpload = args.includes("--upload");
const shouldWriteManifest = args.includes("--write-manifest");
const refreshExisting = args.includes("--refresh-existing");
const limitArg = args.indexOf("--limit");
const limit =
  limitArg !== -1 ? Number.parseInt(args[limitArg + 1], 10) : undefined;
const cdnBaseArg = args.indexOf("--cdn-base-url");
const cdnBaseUrl = cdnBaseArg !== -1 ? args[cdnBaseArg + 1] : undefined;

async function fetchWithCap(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const declaredLength = response.headers.get("content-length");
    if (declaredLength && Number(declaredLength) > MAX_ICON_BYTES) {
      throw new Error(`Content-Length ${declaredLength} exceeds cap`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_ICON_BYTES) {
      throw new Error(`Body ${buffer.byteLength} bytes exceeds cap`);
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

// Uploaded logos vary wildly in aspect ratio and background. `contain` (not
// `cover`) so we never crop off part of the actual icon, flattened onto white
// since that's how these render everywhere else in the product (app lists,
// home screens) - a bare alpha channel here would show through our clip-path
// rounding as a gray/transparent notch instead of a clean corner.
async function normalizeIcon(sourceBytes: Buffer): Promise<Buffer> {
  return sharp(sourceBytes)
    .resize(ICON_SIZE, ICON_SIZE, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

let headCheckWarned = false;

// The key IS a hash of the bytes we are about to store (see iconKeyFor), so a
// key that already exists already holds exactly this content and there is
// nothing to upload - the common case week to week, since most app owners
// don't change their icon. Skipping it keeps the guarantee structural rather
// than incidental: the refresh only ever creates objects.
//
// A HEAD failure that isn't "missing" (credentials scoped to PutObject only,
// say) falls through to uploading rather than failing the refresh - worst case
// is rewriting an object with byte-identical content, which is exactly what
// content addressing makes harmless. Warned once, not per icon.
async function iconAlreadyUploaded(
  s3: { client: S3Client; bucket: string },
  key: string,
): Promise<boolean> {
  try {
    await s3.client.send(
      new HeadObjectCommand({ Bucket: s3.bucket, Key: key }),
    );
    return true;
  } catch (error) {
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;

    if (name !== "NotFound" && status !== 404 && !headCheckWarned) {
      headCheckWarned = true;
      console.warn(
        `\nHEAD ${key} failed (${name ?? "unknown error"}${status ? `, HTTP ${status}` : ""}); ` +
          `uploading without the exists check for the rest of this run.`,
      );
    }

    return false;
  }
}

async function getS3Client(): Promise<{ client: S3Client; bucket: string }> {
  const region = process.env.ASSETS_S3_REGION;
  const bucket = process.env.ASSETS_S3_BUCKET_NAME;

  if (!region || !bucket) {
    throw new Error(
      "ASSETS_S3_REGION and ASSETS_S3_BUCKET_NAME must be set to use --upload.",
    );
  }

  const config: S3ClientConfig = { region };
  return { client: new S3Client(config), bucket };
}

async function main() {
  console.log(`Fetching app rankings from ${RANKINGS_URL} ...`);
  const rankingsRes = await fetch(RANKINGS_URL);

  if (!rankingsRes.ok) {
    throw new Error(
      `Failed to fetch rankings: ${rankingsRes.status} ${rankingsRes.statusText}`,
    );
  }

  const rankings = (await rankingsRes.json()) as RankingsResponse;
  const allApps = [
    ...rankings.app_rankings.top_apps,
    ...(rankings.app_rankings.highlights ?? []),
  ];

  // Same dedup rule icon-manifest.ts already documents: multiple ranking
  // entries can share one logo_img_url (highlights re-listing a top app).
  const seenLogoUrls = new Set<string>();
  const uniqueApps = allApps.filter((app) => {
    if (seenLogoUrls.has(app.logo_img_url)) return false;
    seenLogoUrls.add(app.logo_img_url);
    return true;
  });

  let targets: RankedApp[];

  if (refreshExisting) {
    // Maintenance mode: only touch apps already in the manifest, matched by
    // appId against their CURRENT live URL (not the manifest's own logoUrl,
    // which by now points at our re-hosted copy) - this is how an app
    // owner's icon update actually reaches us.
    const liveById = new Map(allApps.map((app) => [app.app_id, app]));
    const missing: string[] = [];

    const existingSubset = limit
      ? EXISTING_APPS.slice(0, limit)
      : EXISTING_APPS;

    targets = existingSubset
      .map((existing) => {
        const live = liveById.get(existing.appId);
        if (!live) {
          missing.push(existing.appId);
          return null;
        }
        return live;
      })
      .filter((app): app is RankedApp => app !== null);

    if (missing.length > 0) {
      console.log(
        `${missing.length} manifest app(s) no longer in live rankings (left untouched): ${missing.join(", ")}`,
      );
    }

    console.log(
      `Refreshing ${targets.length}/${EXISTING_APPS.length} existing manifest apps.`,
    );
  } else {
    targets = limit ? uniqueApps.slice(0, limit) : uniqueApps;
    console.log(
      `${uniqueApps.length} unique app icons found; processing ${targets.length}.`,
    );
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  let s3: { client: S3Client; bucket: string } | undefined;
  if (shouldUpload) {
    s3 = await getS3Client();
  }

  const results: NormalizedIcon[] = [];
  const failures: Array<{ appId: string; error: string }> = [];
  let uploaded = 0;
  let alreadyPresent = 0;

  for (const app of targets) {
    try {
      if (!SAFE_APP_ID_PATTERN.test(app.app_id)) {
        throw new Error(
          `app_id has unexpected characters: ${JSON.stringify(app.app_id)}`,
        );
      }

      const sourceBytes = await fetchWithCap(app.logo_img_url);
      const normalized = await normalizeIcon(sourceBytes);
      const digest = createHash("sha256")
        .update(normalized)
        .digest("hex")
        .slice(0, ICON_DIGEST_LENGTH);
      const s3Key = iconKeyFor(app.app_id, digest);
      // Local dry-run artifacts stay named by app id (not by digest) so
      // eyeballing "app X's icon" doesn't mean globbing for a hash. summary
      // .json below records the key each one would be uploaded under.
      const outputPath = path.join(OUTPUT_DIR, `${app.app_id}.webp`);

      await writeFile(outputPath, normalized);

      if (s3) {
        if (await iconAlreadyUploaded(s3, s3Key)) {
          alreadyPresent++;
        } else {
          await s3.client.send(
            new PutObjectCommand({
              Bucket: s3.bucket,
              Key: s3Key,
              Body: normalized,
              ContentType: "image/webp",
              CacheControl: "public, max-age=31536000, immutable",
            }),
          );
          uploaded++;
        }
      }

      results.push({
        appId: app.app_id,
        name: app.name,
        sourceUrl: app.logo_img_url,
        outputPath,
        digest,
        s3Key,
        bytes: normalized.byteLength,
      });
      process.stdout.write(".");
    } catch (error) {
      failures.push({
        appId: app.app_id,
        error: error instanceof Error ? error.message : String(error),
      });
      process.stdout.write("x");
    }
  }

  console.log("\n");
  console.log(`Processed: ${results.length}, failed: ${failures.length}`);

  if (s3) {
    console.log(
      `Uploaded ${uploaded} new object(s); ${alreadyPresent} already present with identical bytes.`,
    );
  }

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  ${f.appId}: ${f.error}`);
    }
  }

  const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
  console.log(
    `\nTotal output size: ${(totalBytes / 1024).toFixed(1)} KB (${(totalBytes / results.length / 1024).toFixed(1)} KB avg/icon)`,
  );

  await writeFile(
    path.join(OUTPUT_DIR, "summary.json"),
    JSON.stringify({ results, failures }, null, 2),
  );

  if (shouldWriteManifest) {
    if (!shouldUpload && !cdnBaseUrl) {
      throw new Error(
        "--write-manifest needs either --upload (to compute the real CDN URL) or --cdn-base-url <url> for a dry-run preview.",
      );
    }

    const base =
      cdnBaseUrl ??
      `https://${process.env.NEXT_PUBLIC_IMAGES_CDN_URL ?? "world-id-assets.com"}`;
    const urlFor = (icon: NormalizedIcon) => `${base}/${icon.s3Key}`;

    const manifestDir = path.join(
      __dirname,
      "..",
      "scenes",
      "Onboarding",
      "Home",
      "components",
      "BasePixelStrip",
    );

    if (refreshExisting) {
      // Patch APPS in place, in the SAME order/length as before - only
      // logoUrl changes, for the apps we actually refreshed this run.
      // Anything skipped (missing from live rankings, or failed above)
      // keeps its previous entry untouched. This is what keeps
      // CELL_APP_INDICES (which references APPS by numeric index) valid
      // across runs. Since the URL carries the content hash (see
      // iconKeyFor), an app whose icon is byte-identical to last week
      // patches to the same URL it already had - so the diff, and the PR
      // that carries it, only ever shows icons that genuinely changed.
      const refreshedById = new Map(results.map((r) => [r.appId, r]));
      const patchedApps = EXISTING_APPS.map((existing) => {
        const refreshed = refreshedById.get(existing.appId);
        return refreshed
          ? { ...existing, logoUrl: urlFor(refreshed) }
          : existing;
      });

      const manifestPath = path.join(manifestDir, "icon-manifest.ts");
      const source = await readFile(manifestPath, "utf8");
      const startMarker = "export const APPS: readonly AppIcon[] = [";
      const startIndex = source.indexOf(startMarker);

      if (startIndex === -1) {
        throw new Error(`Could not find "${startMarker}" in ${manifestPath}`);
      }

      const arrayBodyStart = startIndex + startMarker.length;
      // APPS is a flat array of object literals (no nested `];`), so the
      // first `\n];` after the opening unambiguously closes it.
      const endIndex = source.indexOf("\n];", arrayBodyStart);

      if (endIndex === -1) {
        throw new Error(`Could not find the closing "];" for APPS`);
      }

      const appsLiteral = patchedApps
        .map(
          (a) =>
            `\n  {\n    appId: ${JSON.stringify(a.appId)},\n    name: ${JSON.stringify(a.name)},\n    logoUrl: ${JSON.stringify(a.logoUrl)},\n  },`,
        )
        .join("");

      const patchedSource =
        source.slice(0, arrayBodyStart) + appsLiteral + source.slice(endIndex);

      await writeFile(manifestPath, patchedSource);

      // Our generated literal doesn't match the project's line-wrapping
      // rules, and re-serializing every entry (even unchanged ones) would
      // otherwise turn a 5-line real change into a several-thousand-line
      // diff. Reformatting brings unchanged entries back to byte-identical
      // with what was already there, so the diff shows only what changed.
      await execFileAsync("npx", ["prettier", "--write", manifestPath]);

      console.log(
        `\nPatched ${refreshedById.size}/${EXISTING_APPS.length} logoUrl entries in ${manifestPath}`,
      );
    } else {
      const appsLiteral = results
        .map(
          (r) =>
            `  {\n    appId: ${JSON.stringify(r.appId)},\n    name: ${JSON.stringify(r.name)},\n    logoUrl: ${JSON.stringify(urlFor(r))},\n  },`,
        )
        .join("\n");

      const manifestPath = path.join(
        manifestDir,
        "icon-manifest.normalized-apps.ts",
      );

      await writeFile(
        manifestPath,
        `// Generated by scripts/normalize-app-icons.ts - preview of the normalized\n` +
          `// APPS array. Review, then splice into icon-manifest.ts's APPS (keeping\n` +
          `// CELL_APP_INDICES / ICON_SOURCES unchanged, since the cell<->app mapping\n` +
          `// doesn't need to change, only the underlying asset URLs).\n` +
          `import type { AppIcon } from "./icon-manifest";\n\n` +
          `export const NORMALIZED_APPS: readonly AppIcon[] = [\n${appsLiteral}\n];\n`,
      );

      console.log(`\nWrote preview manifest to ${manifestPath}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
