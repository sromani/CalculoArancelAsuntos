require('dotenv').config({ path: 'apps/backend/.env' });
const { PrismaClient } = require('../apps/backend/generated/prisma-estudio');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

const p = new PrismaClient();
p.usuario
  .findMany({ take: 10, select: { usuario: true, activo: true, nombre: true } })
  .then(async (users) => {
    console.log('users count', users.length, users);
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
