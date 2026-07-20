require('dotenv').config({ path: 'apps/backend/.env' });
const { PrismaClient } = require('./apps/backend/generated/prisma-estudio');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

const p = new PrismaClient();
p.usuario
  .findUnique({ where: { usuario: 'admin' } })
  .then(async (u) => {
    console.log('user', u?.usuario, u?.activo);
    if (u) {
      console.log('bcrypt', await bcrypt.compare('Admin1234.v1', u.passwordHash));
      console.log('bcryptjs', await bcryptjs.compare('Admin1234.v1', u.passwordHash));
    } else {
      console.log('no admin user');
    }
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
