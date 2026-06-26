import { defineConfig } from '@prisma/internals';

export default defineConfig({
  datasource: {
    name: 'db',
    url: process.env.DATABASE_URL,
  },
});
