import { defineConfig } from '@prisma/config'
import 'dotenv/config'

export default defineConfig({
  earlyAccess: true as any,
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL
  }
} as any)
