// Script para criar usuário de teste
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { encryptString, decryptString, hmacNormalized } = require('../server/utils/crypto');
const { normalizeHexColor } = require('../server/utils/validation');

const prisma = new PrismaClient();

async function main() {
    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('teste123', 10);

    const emailPlain = 'teste@savit.com';
    const emailHash = hmacNormalized(emailPlain);
    
    const user = await prisma.user.create({
        data: {
            name: encryptString('Usuário Teste'),
            email: encryptString(emailPlain),
            emailHash,
            password: hashedPassword,
            categories: {
                create: [
                    { name: encryptString('Trabalho'), nameHash: hmacNormalized('Trabalho'), color: normalizeHexColor('#34B7F1') },
                    { name: encryptString('Pessoal'), nameHash: hmacNormalized('Pessoal'), color: normalizeHexColor('#25D366') },
                    { name: encryptString('Ideias'), nameHash: hmacNormalized('Ideias'), color: normalizeHexColor('#FFC107') },
                ]
            }
        },
        include: {
            categories: true
        }
    });
    
    console.log('\n✅ Usuário de teste criado com sucesso!\n');
    console.log('📧 Email:', emailPlain);
    console.log('🔑 Senha: teste123');
    console.log('\n📁 Categorias criadas:', user.categories.map(c => decryptString(c.name)).join(', '));
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
