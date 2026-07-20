require('dotenv').config({ path: 'apps/backend/.env' });
const { PrismaClient } = require('./apps/backend/generated/prisma-estudio');
const bcryptjs = require('bcryptjs');

async function main() {
  const p = new PrismaClient();
  const users = await p.usuario.findMany();
  console.log('users:', users.map((u) => u.usuario));
  const u = users[0];
  if (u) {
    const tests = ['Admin1234.v1', 'prueba', '123456', 'password'];
    for (const pw of tests) {
      console.log(`compare "${pw}":`, await bcryptjs.compare(pw, u.passwordHash));
    }
  }
  await p.$disconnect();
}
main().catch(console.error);
