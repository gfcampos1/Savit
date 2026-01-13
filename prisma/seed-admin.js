// Script para criar usuário admin no Railway
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('C@sa17061992#', 10);
    
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
        where: { email: 'guilhermecampos67@gmail.com' }
    });
    
    if (existing) {
        console.log('⚠️  Usuário já existe, atualizando para admin...');
        await prisma.user.update({
            where: { email: 'guilhermecampos67@gmail.com' },
            data: { 
                password: hashedPassword,
                role: 'admin',
                approved: true
            }
        });
        console.log('✅ Usuário atualizado para admin!');
        return;
    }
    
    const user = await prisma.user.create({
        data: {
            name: 'Guilherme Campos',
            email: 'guilhermecampos67@gmail.com',
            password: hashedPassword,
            role: 'admin',
            approved: true,
            categories: {
                create: [
                    { name: 'Trabalho', color: '#34B7F1' },
                    { name: 'Pessoal', color: '#25D366' },
                    { name: 'Ideias', color: '#FFC107' },
                    { name: 'Projetos', color: '#9C27B0' },
                ]
            }
        },
        include: {
            categories: true
        }
    });
    
    console.log('\n✅ Usuário admin criado com sucesso!\n');
    console.log('📧 Email: guilhermecampos67@gmail.com');
    console.log('🔑 Senha: C@sa17061992#');
    console.log('\n📁 Categorias:', user.categories.map(c => c.name).join(', '));
}

main()
    .catch((e) => {
        console.error('Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
