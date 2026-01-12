// Script para criar usuário de teste
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('teste123', 10);
    
    const user = await prisma.user.create({
        data: {
            name: 'Usuário Teste',
            email: 'teste@savit.com',
            password: hashedPassword,
            categories: {
                create: [
                    { name: 'Trabalho', color: '#34B7F1' },
                    { name: 'Pessoal', color: '#25D366' },
                    { name: 'Ideias', color: '#FFC107' },
                ]
            }
        },
        include: {
            categories: true
        }
    });
    
    console.log('\n✅ Usuário de teste criado com sucesso!\n');
    console.log('📧 Email: teste@savit.com');
    console.log('🔑 Senha: teste123');
    console.log('\n📁 Categorias criadas:', user.categories.map(c => c.name).join(', '));
    console.log('\n🚀 Agora rode: npm run dev');
}

main()
    .catch((e) => {
        console.error('Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
