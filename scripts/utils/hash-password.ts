#!/usr/bin/env tsx
import crypto from "node:crypto"

const password = process.argv[2]

if (!password) {
  console.error("Uso: pnpm tsx scripts/utils/hash-password.ts <senha>")
  process.exit(1)
}

const hash = crypto.createHash("sha256").update(password).digest("hex")
console.log(hash)
