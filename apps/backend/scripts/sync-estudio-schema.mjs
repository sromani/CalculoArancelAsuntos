import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.resolve(root, "../../escribanos/frontend/prisma/schema.prisma");
const dest = path.resolve(root, "prisma/schema-estudio.prisma");

if (!fs.existsSync(src)) {
  console.error("[sync-estudio-schema] No se encontró:", src);
  process.exit(1);
}

let content = fs.readFileSync(src, "utf8");
content = content.replace(
  /generator client \{[\s\S]*?\}/,
  `generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma-estudio"
}`,
);
content = content.replace(/url\s+= env\("DATABASE_URL"\)/, 'url      = env("ESTUDIO_DATABASE_URL")');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, content);
console.log("[sync-estudio-schema] OK →", dest);
