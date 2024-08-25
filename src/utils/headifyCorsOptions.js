
export const headifyCorsOptions = (options) => {
  const headers = {};

  const allowOrigins = new Set();
  const allowMethods = new Set();
  const allowHeaders = new Set();
  const exposeHeaders = new Set();
  const allowCredentials = options.allowCredentials;
  const maxAge = options.maxAge;

  options.forEach((option) => {
    option.AllowOrigin.forEach((origin) => allowOrigins.add(origin));
    option.AllowMethods.forEach((method) => allowMethods.add(method));
    option.AllowHeaders.forEach((header) => allowHeaders.add(header));
    option.ExposeHeaders.forEach((header) => exposeHeaders.add(header));
  });

  headers['Access-Control-Allow-Origin'] = Array.from(allowOrigins).join(', ');
  headers['Access-Control-Allow-Methods'] = Array.from(allowMethods).join(', ');
  headers['Access-Control-Allow-Headers'] = Array.from(allowHeaders).join(', ');
  headers['Access-Control-Expose-Headers'] = Array.from(exposeHeaders).join(', ');

  if (allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  if (maxAge > 0) {
    headers['Access-Control-Max-Age'] = maxAge.toString();
  }

  return headers;
};
