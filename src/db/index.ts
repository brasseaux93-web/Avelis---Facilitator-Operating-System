import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// This URL is for local development; it should be an env variable in production.
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/avelis';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
