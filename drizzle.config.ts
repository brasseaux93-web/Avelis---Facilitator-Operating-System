import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://avelis_admin:avelis_password@localhost:5432/avelis_dev',
  },
  verbose: true,
  strict: true,
});
