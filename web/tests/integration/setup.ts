import fs from "fs";
import path from "path";
import { Pool } from "pg";

let pool: Pool | null = null;

export const integrationDBClean = async () => {
  pool = new Pool();

  try {
    await pool.query<any>("BEGIN");

    // Reset database
    const resetDB = fs.readFileSync(
      path.resolve(__dirname, "./db/resetdb.sql"),
      "utf8",
    );
    await pool.query<any>(resetDB);

    // Seed database
    const seedFiles: string[] = fs.readdirSync(
      path.resolve(__dirname, "./db/default"),
    );
    for (const file of seedFiles) {
      try {
        const seedQuery = fs.readFileSync(
          path.resolve(__dirname, `./db/default/${file}`),
          "utf8",
        );
        await pool.query<any>(seedQuery);
      } catch (error) {
        console.error(`Error seeding file ${file}:`, error);
        throw error; // Re-throw the error to trigger rollback
      }
    }
    await pool.query<any>("COMMIT");
  } catch (error) {
    await pool.query<any>("ROLLBACK");
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
  const response = await pool.query<any>(query, values);
  await pool.end();
  return response;
};
