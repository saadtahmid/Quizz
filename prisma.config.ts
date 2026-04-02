import { defineConfig } from '@prisma/config'

export default defineConfig({
  earlyAccess: true as any,
  datasource: {
    url: process.env.DATABASE_URL
  }
} as any)
