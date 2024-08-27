import z from 'zod';

export const corsDefaultConfig = {
  AllowOrigin: ['*'],
  AllowMethods: ['*'],
  AllowHeaders: ['*'],
  ExposeHeaders: ['*'],
  AllowCredentials: true,
  MaxAge: 0,
};

const corsObjectSchema = z.object({
  AllowOrigin: z
    .array(z.string())
    .default(corsDefaultConfig.AllowOrigin)
    .transform((arr) => Array.from(new Set(arr))),
  AllowMethods: z
    .array(z.enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', '*']))
    .default(corsDefaultConfig.AllowMethods)
    .transform((arr) => Array.from(new Set(arr))),
  AllowHeaders: z
    .array(z.string())
    .default(corsDefaultConfig.AllowHeaders)
    .transform((arr) => Array.from(new Set(arr))),
  ExposeHeaders: z
    .array(z.string())
    .default(corsDefaultConfig.ExposeHeaders)
    .transform((arr) => Array.from(new Set(arr))),
  AllowCredentials: z.boolean().default(corsDefaultConfig.AllowCredentials),
  MaxAge: z.number().min(0).optional().default(corsDefaultConfig.MaxAge),
});

const configSchema = z
  .object({
    apiType: z.enum(['rest', 'events', 'rpc']).optional().default('rest'),
    proto: z.enum(['http', 'ws', 'https']).optional().default('http'),
    transport: z
      .array(z.enum(['http', 'ws']))
      .optional()
      .default(['http'])
      .refine((arr) => arr.length > 0, { message: 'At least one transport method must be specified' })
      .transform((arr) => Array.from(new Set(arr))),
    port: z.coerce.number().int().min(1).max(65535).optional().default(8888),
    host: z.string().min(4).optional().default('localhost'),
    authStrategy: z.enum(['none', 'session', 'bearer']).optional().default('none'),
    corsOptions: z
      .array(corsObjectSchema)
      .default([corsDefaultConfig])
      .transform((arr) => {
        if (arr.length === 0 || Object.keys(arr[0]).length === 0) {
          return [corsDefaultConfig];
        }
        return arr.map((obj) => ({ ...corsDefaultConfig, ...obj }));
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
