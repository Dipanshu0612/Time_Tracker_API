import { Database } from "./kysely.js";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import { configDotenv } from "dotenv";
configDotenv();

const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: 3306,
    connectionLimit: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
