import z from 'zod';

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
