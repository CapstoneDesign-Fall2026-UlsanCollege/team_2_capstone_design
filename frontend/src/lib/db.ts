import { neon } from "@neondatabase/serverless";

const connectionString = 
  process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_OGVNdLK73nhq@ep-dark-term-avy8vnke-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(connectionString);
