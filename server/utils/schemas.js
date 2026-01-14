const { z } = require('zod');

const MAX_TEXT_LENGTH = 10000;
const MAX_IMAGES = 5;

const Email = z.string().trim().toLowerCase().email();
const Password = z
  .string()
  .min(10, 'A senha deve ter pelo menos 10 caracteres.')
  .max(128, 'A senha deve ter no máximo 128 caracteres.')
  .refine((v) => !/\s/.test(v), 'A senha não pode conter espaços.')
  .refine((v) => /[A-Za-z]/.test(v), 'A senha deve conter pelo menos uma letra.')
  .refine((v) => /\d/.test(v), 'A senha deve conter pelo menos um número.');

const Name = z.string().trim().min(1, 'Nome é obrigatório.').max(100, 'Nome muito longo.');

const HexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida. Use #RGB ou #RRGGBB.');

const SafeImageSrc = z
  .string()
  .max(2_000_000)
  .refine((v) => {
    if (typeof v !== 'string') return false;
    // data URLs (no SVG)
    if (v.startsWith('data:image/png;base64,')) return true;
    if (v.startsWith('data:image/jpeg;base64,')) return true;
    if (v.startsWith('data:image/webp;base64,')) return true;
    // https URLs allowed
    if (v.startsWith('https://')) return true;
    return false;
  }, 'Imagem inválida.');

const AuthLoginBody = z.object({
  email: Email,
  password: z.string().min(1, 'Senha é obrigatória.'),
  mfaCode: z.string().trim().regex(/^\d{6}$/, 'Código MFA inválido.').optional()
});

const AuthRegisterBody = z.object({
  name: Name,
  email: Email,
  password: Password
});

const AuthChangePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória.'),
  newPassword: Password
});

const AuthRefreshBody = z.object({}).optional();

const AdminResetUserPasswordBody = z
  .object({
    newPassword: Password.optional()
  })
  .optional();

const MfaCodeBody = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Código MFA inválido.')
});

const AuthProfileUpdateBody = z.object({
  name: Name.optional(),
  avatar: SafeImageSrc.optional().or(z.literal('')).or(z.null())
}).partial();

const CategoryCreateBody = z.object({
  name: z.string().trim().min(1, 'O nome da categoria é obrigatório.').max(100, 'Nome muito longo.'),
  color: HexColor.optional()
});

const CategoryUpdateBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: HexColor.optional().or(z.literal(''))
}).partial();

const MessageCreateBody = z.object({
  text: z.string().trim().max(MAX_TEXT_LENGTH).optional().default(''),
  categoryId: z.string().trim().optional().nullable(),
  isTask: z.boolean().optional().default(false),
  taskDate: z.string().trim().optional().nullable(),
  taskTime: z.string().trim().optional().nullable(),
  images: z.array(SafeImageSrc).max(MAX_IMAGES).optional().default([])
}).refine((v) => {
  const hasText = Boolean(v.text && v.text.trim());
  const hasImages = Array.isArray(v.images) && v.images.length > 0;
  return hasText || hasImages;
}, { message: 'O texto da mensagem ou uma imagem é obrigatório.' });

const MessageUpdateBody = z.object({
  text: z.string().trim().max(MAX_TEXT_LENGTH).optional(),
  categoryId: z.string().trim().optional().nullable(),
  isTask: z.boolean().optional(),
  taskDate: z.string().trim().optional().nullable(),
  taskTime: z.string().trim().optional().nullable(),
  taskCompleted: z.boolean().optional(),
  images: z.array(SafeImageSrc).max(MAX_IMAGES).optional()
}).partial();

const MessagesQuery = z.object({
  categoryId: z.string().trim().optional(),
  search: z.string().trim().max(200).optional(),
  date: z.string().trim().max(30).optional(),
  isTask: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const Cuid = z.string().cuid('ID inválido.');

const IdParam = z.object({
  id: Cuid
});

const UserIdParam = z.object({
  userId: Cuid
});

module.exports = {
  AuthLoginBody,
  AuthRegisterBody,
  AuthChangePasswordBody,
  AuthProfileUpdateBody,
  AuthRefreshBody,
  AdminResetUserPasswordBody,
  MfaCodeBody,
  CategoryCreateBody,
  CategoryUpdateBody,
  MessageCreateBody,
  MessageUpdateBody,
  MessagesQuery,
  IdParam,
  UserIdParam,
  Password
};
