import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString 
  ? neon(connectionString) 
  : ((() => Promise.resolve([])) as any);
