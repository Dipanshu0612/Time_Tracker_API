import knex from "knex";
import knexfile from "./knexfile.js";
const db = knex(knexfile);

async function checkConnection() {
    try {
        await db.raw("SELECT 1+1 AS result");
        console.log("Database connected successfully");
        return true;
    } catch (err) {
        console.error("Error connecting to the database:", err);
        return false;
    }
}

export default { db, checkConnection };
