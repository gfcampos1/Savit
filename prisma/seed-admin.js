// Seed de admin (NÃO coloque credenciais no código)
// Uso:
//   SEED_ADMIN_EMAIL="..." SEED_ADMIN_PASSWORD="..." node prisma/seed-admin.js
// O usuário será criado/atualizado com role=admin e approved=true.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { encryptString, decryptString, hmacNormalized } = require('../server/utils/crypto');
const { normalizeHexColor } = require('../server/utils/validation');

const prisma = new PrismaClient();

async function main() {
    const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const passwordPlain = process.env.SEED_ADMIN_PASSWORD || '';
    const name = (process.env.SEED_ADMIN_NAME || 'Admin').trim();

    if (!email) {
        throw new Error('SEED_ADMIN_EMAIL não informado');
    }
    if (!passwordPlain) {
        throw new Error('SEED_ADMIN_PASSWORD não informado');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 12);
    const emailHash = hmacNormalized(email);

    const user = await prisma.user.upsert({
        where: { emailHash },
        create: {
            name: encryptString(name),
            email: encryptString(email),
            emailHash,
            password: hashedPassword,
            role: 'admin',
            approved: true,
            categories: {
                create: [
                    { name: encryptString('Trabalho'), nameHash: hmacNormalized('Trabalho'), color: normalizeHexColor('#34B7F1') },
                    { name: encryptString('Pessoal'), nameHash: hmacNormalized('Pessoal'), color: normalizeHexColor('#25D366') },
                    { name: encryptString('Ideias'), nameHash: hmacNormalized('Ideias'), color: normalizeHexColor('#FFC107') },
                    { name: encryptString('Projetos'), nameHash: hmacNormalized('Projetos'), color: normalizeHexColor('#9C27B0') },
                ]
            }
        },
        update: {
            name: encryptString(name),
            email: encryptString(email),
            emailHash,
            password: hashedPassword,
            role: 'admin',
            approved: true,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approved: true,
        }
    });

    console.log('✅ Admin seed OK:', {
        ...user,
        email: decryptString(user.email),
        name: decryptString(user.name)
    });
}

main()
    .catch((e) => {
        console.error('Erro:', e.message || e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
