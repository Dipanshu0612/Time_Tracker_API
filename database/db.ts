import { Database } from "./kysely.js";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import { configDotenv } from "dotenv";
import url from "url";

configDotenv();

const DB_URL = process.env.DB;
if (!DB_URL) {
  throw new Error("DB_URL is not defined");
}
const parsedUrl = new URL(DB_URL);

const dialect = new MysqlDialect({
  pool: createPool({
    database: parsedUrl.pathname.slice(1),
    host: parsedUrl.hostname,
    user: parsedUrl.username,
    password: parsedUrl.password,
    port: 19880,
    connectionLimit: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
