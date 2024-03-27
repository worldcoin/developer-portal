import fs from "fs";
import path from "path";
import { Pool } from "pg";

let pool: Pool | null = null;

export const integrationDBClean = async () => {
  pool = new Pool();

  try {
    await pool.query("BEGIN");

    // Reset database
    const resetDB = fs.readFileSync(
      path.resolve(__dirname, "./db/resetdb.sql"),
      "utf8",
    );
    await pool.query(resetDB);

    // Seed database
    const seedFiles: string[] = fs.readdirSync(
      path.resolve(__dirname, "./db/default"),
    );
    for (const file of seedFiles) {
      const seedQuery = fs.readFileSync(
        path.resolve(__dirname, `./db/default/${file}`),
        "utf8",
      );
      await pool.query(seedQuery);
    }
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
  return;
};

export const integrationDBExecuteQuery = async (
  query: string,
  values?: any[],
) => {
  pool = new Pool();
  const response = await pool.query(query, values);
  await pool.end();
  return response;
};
