import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

// `prisma generate` (run on every install) doesn't connect, so it must not fail when DATABASE_URL isn't available yet
const generatingOnly = process.argv.includes("generate") && !process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: generatingOnly ? "postgresql://placeholder:placeholder@localhost:5432/placeholder" : env("DATABASE_URL"),
  },
});
