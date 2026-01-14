const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

const { decryptString, hmacNormalized } = require('../server/utils/crypto');

async function main() {
    const email = (process.env.CHECK_USER_EMAIL || '').trim().toLowerCase();
    if (!email) {
        throw new Error('CHECK_USER_EMAIL não informado');
    }

    const emailHash = hmacNormalized(email);
    const user = await prisma.user.findFirst({
        where: { emailHash },
        select: { id: true, email: true, role: true, approved: true, name: true }
    });

    console.log('User:', user ? { ...user, email: decryptString(user.email), name: decryptString(user.name) } : null);

    if (!user) {
        throw new Error('Usuário não encontrado (verifique CHECK_USER_EMAIL e se o backfill foi executado)');
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            role: 'admin',
            approved: true
        },
        select: { id: true, email: true, role: true, approved: true, name: true }
    });

    console.log('Updated user:', { ...updated, email: decryptString(updated.email), name: decryptString(updated.name) });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
