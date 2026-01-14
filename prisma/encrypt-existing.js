require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { encryptString, decryptString, isEncryptedString, hmacNormalized } = require('../server/utils/crypto');

const prisma = new PrismaClient();

async function main() {
    // Users: encrypt name/avatar
    const users = await prisma.user.findMany({
        select: { id: true, email: true, emailHash: true, name: true, avatar: true }
    });

    for (const user of users) {
        const updates = {};

        if (user.email && !isEncryptedString(user.email)) {
            const normalized = String(user.email).toLowerCase();
            updates.email = encryptString(normalized);
        }

        // Always (re)compute hash from decrypted/plain email
        const plainEmail = decryptString(user.email);
        const hash = hmacNormalized(String(plainEmail).toLowerCase());
        if (!user.emailHash || user.emailHash !== hash) {
            updates.emailHash = hash;
        }

        if (user.name && !isEncryptedString(user.name)) {
            updates.name = encryptString(user.name);
        }
        if (user.avatar !== null && user.avatar !== undefined && user.avatar !== '' && !isEncryptedString(user.avatar)) {
            updates.avatar = encryptString(user.avatar);
        }
        if (Object.keys(updates).length) {
            await prisma.user.update({ where: { id: user.id }, data: updates });
        }
    }

    // Categories: encrypt name + compute name_hash
    const categories = await prisma.category.findMany({
        select: { id: true, userId: true, name: true, nameHash: true }
    });

    for (const category of categories) {
        // If name is encrypted, decrypt for hashing.
        const plainName = decryptString(category.name);
        const updates = {};

        if (!isEncryptedString(category.name)) {
            updates.name = encryptString(plainName);
        }

        const hash = hmacNormalized(plainName);
        if (!category.nameHash || category.nameHash !== hash) {
            updates.nameHash = hash;
        }

        if (Object.keys(updates).length) {
            await prisma.category.update({ where: { id: category.id }, data: updates });
        }
    }

    // Messages: encrypt text/images JSON
    const messages = await prisma.message.findMany({
        select: { id: true, text: true, images: true }
    });

    for (const message of messages) {
        const updates = {};

        if (message.text !== null && message.text !== undefined && !isEncryptedString(message.text)) {
            updates.text = encryptString(message.text);
        }

        if (message.images !== null && message.images !== undefined && message.images !== '' && !isEncryptedString(message.images)) {
            updates.images = encryptString(message.images);
        }

        if (Object.keys(updates).length) {
            await prisma.message.update({ where: { id: message.id }, data: updates });
        }
    }

    console.log('✅ Backfill encryption complete');
}

main()
    .catch((e) => {
        console.error('❌ Backfill encryption failed:', e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
