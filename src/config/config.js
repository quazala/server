import { z } from 'zod';

const httpSchema = z.object({
  type: z.literal('http'),
  ws: z.boolean().optional(),
});

const httpsSchema = z.object({
  type: z.literal('https'),
  cert: z.string(),
  key: z.string(),
  ws: z.boolean().optional(),
});

const sessionAuthSchema = z.object({
  type: z.literal('session'),
  secret: z.string(),
  name: z.string().optional().default('connect.sid'),
  resave: z.boolean().optional().default(false),
  saveUninitialized: z.boolean().optional().default(false),
  cookie: z
    .object({
      secure: z.boolean().optional(),
      httpOnly: z.boolean().optional().default(true),
      maxAge: z.number().optional(),
      sameSite: z.enum(['lax', 'strict', 'none']).optional(),
      domain: z.string().optional(),
      path: z.string().optional().default('/'),
    })
    .optional(),
  rolling: z.boolean().optional().default(false),
  unset: z.enum(['destroy', 'keep']).optional().default('keep'),
  store: z
    .object({
      type: z.enum(['memory', 'redis', 'mongo']),
      options: z.record(z.any()).optional(),
    })
    .optional(),
});

const bearerAuthSchema = z.object({
  type: z.literal('bearer'),
  secret: z.string(),
  algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']).optional().default('HS256'),
  expiresIn: z.string().optional().default('1h'),
  notBefore: z.string().optional(),
  audience: z.string().optional(),
  issuer: z.string().optional(),
  jwtid: z.string().optional(),
  subject: z.string().optional(),
  noTimestamp: z.boolean().optional().default(false),
  header: z.record(z.any()).optional(),
  encoding: z.string().optional().default('utf8'),
});

const configSchema = z.object({
  transport: z.discriminatedUnion('type', [httpSchema, httpsSchema]),
  port: z.coerce.number().int().optional().default(8888),
  host: z.string().optional().default('localhost'),
  auth: z.discriminatedUnion('type', [z.object({ type: z.literal('none') }), sessionAuthSchema, bearerAuthSchema]).optional(),
});

export const validateConfig = (source) => {
  return configSchema.parse(source);
};
