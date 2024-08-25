export const headifyCorsOptions = (options) => {
  const allowOrigins = options.flatMap((option) => option.AllowOrigin).reduce((set, origin) => set.add(origin), new Set());
  const allowMethods = options.flatMap((option) => option.AllowMethods).reduce((set, method) => set.add(method), new Set());
  const allowHeaders = options.flatMap((option) => option.AllowHeaders).reduce((set, header) => set.add(header), new Set());
  const exposeHeaders = options.flatMap((option) => option.ExposeHeaders).reduce((set, header) => set.add(header), new Set());

  const allowCredentials = options.allowCredentials;
  const maxAge = options.maxAge;

  const headers = {
    'Access-Control-Allow-Origin': Array.from(allowOrigins).join(', '),
    'Access-Control-Allow-Methods': Array.from(allowMethods).join(', '),
    'Access-Control-Allow-Headers': Array.from(allowHeaders).join(', '),
    'Access-Control-Expose-Headers': Array.from(exposeHeaders).join(', '),
  };

  if (allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  if (maxAge > 0) {
    headers['Access-Control-Max-Age'] = maxAge.toString();
  }

  return headers;
};
