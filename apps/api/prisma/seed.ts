// Stub do seed. Será populado quando F1 (auth) estiver pronta:
// criar user demo + categorias da paleta + algumas notas/tarefas mock.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('seed: nothing to do yet (F0 bootstrap)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
