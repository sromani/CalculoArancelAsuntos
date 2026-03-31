/**
 * Crea la base indicada en DATABASE_URL (conexión a la base `postgres`) y ejecuta `prisma db push`.
 * Usa TCP (`pg`); si falla, intenta `docker exec`.
 * Uso: desde escribanos/frontend → npm run db:estudio:setup
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Client } = require("pg");

const root = path.join(__dirname, "..");

function leerDatabaseUrl() {
  for (const nombre of [".env.local", ".env"]) {
    const p = path.join(root, nombre);
    if (!fs.existsSync(p)) {
      continue;
    }
    const texto = fs.readFileSync(p, "utf8");
    for (const linea of texto.split(/\r?\n/)) {
      const t = linea.trim();
      if (!t || t.startsWith("#")) {
        continue;
      }
      const eq = t.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const clave = t.slice(0, eq).trim();
      if (clave !== "DATABASE_URL") {
        continue;
      }
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return process.env.DATABASE_URL?.trim() || "";
}

const DATABASE_URL = leerDatabaseUrl();
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local o .env");
  process.exit(1);
}

function nombreBaseDesdeUrl(urlString) {
  const u = new URL(urlString);
  const name = u.pathname.replace(/^\//, "").split("?")[0];
  if (!name) {
    throw new Error("DATABASE_URL sin nombre de base en el path.");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Nombre de base no soportado: ${name}`);
  }
  return name;
}

async function asegurarBasePostgres() {
  const dbName = nombreBaseDesdeUrl(DATABASE_URL);
  if (dbName === "postgres") {
    console.log('DATABASE_URL apunta a la base "postgres"; no se crea nada.');
    return;
  }

  const adminUrl = new URL(DATABASE_URL);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const r = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (r.rowCount === 0) {
      console.log(`Creando base de datos "${dbName}"…`);
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log("Base creada.");
    } else {
      console.log(`La base "${dbName}" ya existe.`);
    }
  } finally {
    await client.end();
  }
}

function fallbackDocker() {
  console.log("Intentando crear la base vía Docker (contenedor sistema_escribanos_postgres)…");
  execSync(
    'docker exec sistema_escribanos_postgres psql -U admin_escribanos -d postgres -c "CREATE DATABASE sistema_escribanos_estudio;"',
    { stdio: "inherit", shell: true },
  );
}

async function main() {
  try {
    await asegurarBasePostgres();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Postgres (TCP):", msg);
    try {
      fallbackDocker();
    } catch {
      console.error(
        "No se pudo crear la base. Comprobá que Postgres esté en marcha y que DATABASE_URL sea correcta.",
      );
      process.exit(1);
    }
  }

  console.log("Aplicando schema Prisma (db push)…");
  try {
    execSync("npx prisma db push", { stdio: "inherit", cwd: root, shell: true });
  } catch {
    process.exit(1);
  }
  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
