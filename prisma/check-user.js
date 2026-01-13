const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = (process.env.CHECK_USER_EMAIL || '').trim().toLowerCase();
    if (!email) {
        throw new Error('CHECK_USER_EMAIL não informado');
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, approved: true, name: true }
    });

    console.log('User:', user);

    const updated = await prisma.user.update({
        where: { email },
        data: {
            role: 'admin',
            approved: true
        },
        select: { id: true, email: true, role: true, approved: true, name: true }
    });

    console.log('Updated user:', updated);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
