/**
 * Alias útil en Windows cuando hace falta regenerar el cliente después de bloqueos.
 * El cliente vive en node_modules (.prisma); no depende de generated/prisma.
 */
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
console.log("Ejecutando prisma generate…\n");
execSync("npx prisma generate", { stdio: "inherit", cwd: root, env: process.env });
