import { Pool } from "pg";

const fs = require("fs");
const path = require("path");

let pool: Pool | null = null;

export const integrationDBSetup = async () => {
  pool = new Pool();

  // Reset database
  const resetdb = fs.readFileSync(
    path.resolve(__dirname, "./db/resetdb.sql"),
    "utf8"
  );
  await pool.query(resetdb);

  // Seed database
  const seedFiles: string[] = fs.readdirSync(
    path.resolve(__dirname, "./db/default")
  );
  for (const file of seedFiles) {
    const seedQuery = fs.readFileSync(
      path.resolve(__dirname, `./db/default/${file}`),
      "utf8"
    );
    await pool.query(seedQuery);
  }
};

export const integrationDBTearDown = async () => {
  pool?.end();
};
