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

// Categorias fixas do sistema: vêm pré-criadas para todo usuário, não podem
// ser deletadas (apenas ocultadas via hiddenAt). Identificadas por slug.
const FIXED: Array<{ slug: string; name: string; color: string; icon: string; sortOrder: number }> = [
  { slug: 'books', name: 'Livros', color: '#7a5cc7', icon: 'book', sortOrder: 100 },
  { slug: 'youtube', name: 'YouTube', color: '#c0563a', icon: 'play', sortOrder: 101 },
];

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });
  if (count === 0) {
    await prisma.category.createMany({
      data: DEFAULTS.map((c, i) => ({ ...c, userId, sortOrder: i })),
    });
  }
  await ensureFixedCategories(userId);
}

/**
 * Idempotente: cria categorias fixas que ainda não existem para o usuário.
 * Usa upsert por (userId, slug). Seguro chamar várias vezes.
 */
export async function ensureFixedCategories(userId: string): Promise<void> {
  for (const f of FIXED) {
    await prisma.category.upsert({
      where: { userId_slug: { userId, slug: f.slug } },
      update: {},
      create: {
        userId,
        slug: f.slug,
        name: f.name,
        color: f.color,
        icon: f.icon,
        sortOrder: f.sortOrder,
      },
    });
  }
}
