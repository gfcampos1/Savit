const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'guilhermecampos67@gmail.com' }
    });
    
    console.log('User data:', JSON.stringify(user, null, 2));
    
    // Force update
    const updated = await prisma.user.update({
        where: { email: 'guilhermecampos67@gmail.com' },
        data: { 
            role: 'admin',
            approved: true
        }
    });
    
    console.log('\nUpdated user:', JSON.stringify(updated, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
