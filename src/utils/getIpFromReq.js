export function getIpFromReq(req) {
  const xForwardedFor = req?.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    return ips[0];
  }
  return req?.connection?.remoteAddress || req?.socket?.remoteAddress;
}
