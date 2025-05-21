import dotenv from "dotenv";
import { Pool } from "pg";
import { logger } from "../web/lib/logger";

const normalizeNullifierHash = (nullifierHash: string): string => {
  const normalized = nullifierHash.toLowerCase().trim().replace(/^0x/, "");

  return `0x${normalized}`;
};

/**
 * Converts a nullifier hash to its numeric representation for database storage and comparison
 * This helps prevent case sensitivity, prefix, and padding bypass attacks
 */
export const nullifierHashToBigIntStr = (nullifierHash: string): string => {
  const normalized = normalizeNullifierHash(nullifierHash);
  return BigInt(normalized).toString();
};

/**
 * Required environment variables:
 * - POSTGRES_CONNECTION_URL: PostgreSQL connection string
 */

// Load environment variables
dotenv.config();

// Configuration
const FETCH_BATCH_SIZE = 50; // How many rows to query at once
const UPDATE_BATCH_SIZE = 10; // How many rows to update in a single query
const STOP_AFTER_N_FAILED_BATCHES = 10; // Stop after this many batches fail to update

interface UpdateRow {
  id: string;
  hashInt: string;
}

interface DbRow {
  id: string;
  nullifier_hash: string;
}

interface PopulatedRecord {
  id: string;
  nullifier_hash: string;
  nullifier_hash_int: string;
}

/**
 * Creates a bulk update query for multiple rows
 */
function createBulkUpdateQuery(updates: UpdateRow[]) {
  const values = updates
    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
    .join(", ");

  const flatParams = updates.flatMap((update) => [update.id, update.hashInt]);

  const query = `
    UPDATE nullifier AS n
    SET 
      nullifier_hash_int = v.hash_int,
      updated_at = NOW()
    FROM (VALUES ${values}) AS v(id, hash_int)
    WHERE n.id = v.id
  `;

  return {
    query,
    params: flatParams,
  };
}

/**
 * Count how many records need their nullifier_hash_int populated
 */
async function countRecordsToUpdate(pool: Pool): Promise<number> {
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM nullifier WHERE nullifier_hash_int IS NULL"
  );
  return parseInt(countResult.rows[0].count, 10);
}

/**
 * Fetch a batch of records that need updating
 */
async function fetchBatch(pool: Pool, batchSize: number): Promise<DbRow[]> {
  const result = await pool.query(
    "SELECT id, nullifier_hash FROM nullifier WHERE nullifier_hash_int IS NULL ORDER BY id LIMIT $1",
    [batchSize]
  );
  return result.rows;
}

/**
 * Prepare update batches from fetched records
 */
function prepareUpdateBatches(records: DbRow[]): UpdateRow[][] {
  const updateBatches: UpdateRow[][] = [];
  const batchCount = Math.ceil(records.length / UPDATE_BATCH_SIZE);

  for (let i = 0; i < batchCount; i++) {
    const start = i * UPDATE_BATCH_SIZE;
    const end = Math.min(start + UPDATE_BATCH_SIZE, records.length);
    const batchRows = records.slice(start, end);

    const updates: UpdateRow[] = [];

    for (const row of batchRows) {
      try {
        updates.push({
          id: row.id,
          hashInt: nullifierHashToBigIntStr(row.nullifier_hash),
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Error processing record ${row.id}: ${errorMessage}`);
      }
    }

    if (updates.length > 0) {
      updateBatches.push(updates);
    }
  }

  return updateBatches;
}

/**
 * Execute update batches and return count of updated rows
 */
async function executeUpdateBatches(
  pool: Pool,
  updateBatches: UpdateRow[][]
): Promise<number> {
  let updatedCount = 0;

  for (let i = 0; i < updateBatches.length; i++) {
    const { query, params } = createBulkUpdateQuery(updateBatches[i]);
    const updateResult = await pool.query(query, params);
    const rowCount = updateResult.rowCount || 0;
    updatedCount += rowCount;
  }

  return updatedCount;
}

/**
 * Report progress of the update operation
 */
function reportProgress(current: number, total: number): void {
  const progressPercent = ((current / total) * 100).toFixed(2);
  logger.info(`Processed ${current} of ${total} records (${progressPercent}%)`);
}

/**
 * Log nullifier_hash_int duplicates
 */
async function logPopulatedRecords(pool: Pool): Promise<void> {
  try {
    // Find duplicated nullifier_hash_int values
    const duplicatesQuery = `
      SELECT 
        nullifier_hash_int, 
        COUNT(*) as count, 
        ARRAY_AGG(nullifier_hash) as hashes,
        ARRAY_AGG(uses) as uses_array,
        ARRAY_AGG(id) as ids
      FROM nullifier 
      WHERE nullifier_hash_int IS NOT NULL
      GROUP BY nullifier_hash_int 
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;

    const duplicatesResult = await pool.query(duplicatesQuery);
    const duplicateCount = duplicatesResult.rows.length;

    // Get total count of populated records
    const populatedCountResult = await pool.query(
      "SELECT COUNT(*) FROM nullifier WHERE nullifier_hash_int IS NOT NULL"
    );
    const populatedCount = parseInt(populatedCountResult.rows[0].count, 10);

    logger.info(`Total populated records: ${populatedCount}`);
    logger.info(
      `Number of nullifier_hash_int values with duplicates: ${duplicateCount}`
    );

    if (duplicateCount === 0) {
      logger.info("No duplicates found - each nullifier_hash_int is unique.");
      return;
    }

    logger.info("Duplicates found", { data: duplicatesResult.rows });

    // Log each duplicate group
    duplicatesResult.rows.forEach((row, index) => {
      logger.info(
        `\nDuplicate Group #${index + 1}: "${row.nullifier_hash_int}"`
      );
      logger.info(`  Appears ${row.count} times`);
      logger.info("  Original nullifier_hash values:");

      // Log each instance in the duplicate group
      for (let i = 0; i < row.count; i++) {
        logger.info(
          `    - ID: ${row.ids[i]}, Hash: ${row.hashes[i]}, Uses: ${row.uses_array[i]}`
        );
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error checking for duplicates: ${errorMessage}`);
  }
}

/**
 * Main function to populate nullifier_hash_int column
 */
async function populateNullifierHashInt() {
  // Get database connection string from environment variables
  const connectionString = process.env.POSTGRES_CONNECTION_URL;

  if (!connectionString) {
    logger.error("POSTGRES_CONNECTION_URL environment variable is not set");
    process.exit(1);
  }

  // Create a database connection pool
  const pool = new Pool({ connectionString });

  try {
    logger.info("Connecting to database...");

    // Get total count of records needing update
    const totalCount = await countRecordsToUpdate(pool);

    if (totalCount === 0) {
      logger.info("No records found with null nullifier_hash_int. Exiting.");
      return;
    }

    logger.info(`Found ${totalCount} records with null nullifier_hash_int`);
    let processedCount = 0;

    // Process in batches until all records are updated
    let failedBatches = 0;
    while (processedCount < totalCount) {
      try {
        const batchNumber = Math.floor(processedCount / FETCH_BATCH_SIZE) + 1;
        logger.info(`Processing fetch batch ${batchNumber}...`);

        // 1. Fetch a batch of records
        const records = await fetchBatch(pool, FETCH_BATCH_SIZE);

        if (records.length === 0) {
          break; // No more records to process
        }

        // 2. Prepare update batches
        const updateBatches = prepareUpdateBatches(records);

        // 3. Execute update batches
        const updatedCount = await executeUpdateBatches(pool, updateBatches);
        processedCount += updatedCount;

        // 4. Report progress
        reportProgress(processedCount, totalCount);

        logger.info("Finished processing all records");

        // Log populated records after completion
        await logPopulatedRecords(pool);
      } catch (err) {
        logger.error(`Database error: ${err}`);
        failedBatches++;
        if (failedBatches >= STOP_AFTER_N_FAILED_BATCHES) {
          logger.error(`Too many failed batches. Exiting.`);
          process.exit(1);
        }
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database error: ${errorMessage}`);
  } finally {
    await pool.end();
  }
}

// Run the script
populateNullifierHashInt()
  .then(() => {
    logger.info("Script completed successfully");
    process.exit(0);
  })
  .catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Script failed: ${errorMessage}`);
    process.exit(1);
  });
