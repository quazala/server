import z from 'zod';

export const CORS_DEFAULT_CONFIG = {
  AllowOrigin: ['*'],
  AllowMethods: ['*'],
  AllowHeaders: ['*'],
  ExposeHeaders: ['*'],
  AllowCredentials: true,
  MaxAge: 0,
};

const corsObjectSchema = z.object({
  AllowOrigin: z.array(z.string()).default(CORS_DEFAULT_CONFIG.AllowOrigin),
  AllowMethods: z.array(z.enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', '*'])).default(CORS_DEFAULT_CONFIG.AllowMethods),
  AllowHeaders: z.array(z.string()).default(CORS_DEFAULT_CONFIG.AllowHeaders),
  ExposeHeaders: z.array(z.string()).default(CORS_DEFAULT_CONFIG.ExposeHeaders),
  AllowCredentials: z.boolean().default(CORS_DEFAULT_CONFIG.AllowCredentials),
  MaxAge: z.number().default(CORS_DEFAULT_CONFIG.MaxAge),
});

const configSchema = z
  .object({
    proto: z.enum(['http', 'ws', 'https']).optional().default('http'),
    transport: z
      .array(z.enum(['http', 'ws']))
      .optional()
      .default(['http'])
      .refine((arr) => arr.length > 0, { message: 'At least one transport method must be specified' }),
    port: z.coerce.number().int().optional().default(8888),
    host: z.string().optional().default('localhost'),
    authStrategy: z.enum(['none', 'session', 'bearer']).optional().default('none'),
    corsOptions: z
      .array(corsObjectSchema)
      .default([CORS_DEFAULT_CONFIG])
      .transform((arr) => {
        if (arr.length === 0 || Object.keys(arr[0]).length === 0) {
          return [CORS_DEFAULT_CONFIG];
        }
        return arr.map((obj) => ({ ...CORS_DEFAULT_CONFIG, ...obj }));
      }),
  })
  .refine(
    (data) => {
      if (data.authStrategy !== 'none' && data.proto !== 'http') {
        return false;
      }
      return true;
    },
    {
      message: "Authentication strategies other than 'none' require the 'http' protocol",
      path: ['authStrategy'],
    },
  );

export const validateConfig = (source) => {
  return configSchema.parse(source);
};
