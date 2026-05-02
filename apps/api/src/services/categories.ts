import { prisma } from '../lib/prisma.js';

// Conjunto inicial criado automaticamente após o registro. Os usuários podem
// editar/excluir/criar livremente depois. Cores vêm da paleta da SPEC §1.5.
const DEFAULTS: Array<{ name: string; color: string }> = [
  { name: 'Trabalho', color: '#c0563a' },
  { name: 'Pessoal', color: '#7a5cc7' },
  { name: 'Ideias', color: '#e6b540' },
  { name: 'Estudos', color: '#3a8a6a' },
  { name: 'Saúde', color: '#5cd6c0' },
];

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;
  await prisma.category.createMany({
    data: DEFAULTS.map((c, i) => ({ ...c, userId, sortOrder: i })),
  });
}
