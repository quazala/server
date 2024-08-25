import { describe, expect, it } from 'vitest';
import { validateConfig } from '../src/config/config'; // Adjust the import path as needed

describe('validateConfig', () => {
  describe('transport', () => {
    it('should accept valid HTTP transport configuration', () => {
      const result = validateConfig({
        transport: { type: 'http' },
      });
      expect(result.transport).toEqual({ type: 'http' });
    });

    it('should accept valid HTTPS transport configuration', () => {
      const result = validateConfig({
        transport: { type: 'https', cert: 'cert.pem', key: 'key.pem' },
      });
      expect(result.transport).toEqual({ type: 'https', cert: 'cert.pem', key: 'key.pem' });
    });

    it('should throw an error for invalid transport type', () => {
      expect(() => validateConfig({ transport: { type: 'ftp' } })).toThrow();
    });

    it('should accept optional ws flag for HTTP transport', () => {
      const result = validateConfig({
        transport: { type: 'http', ws: true },
      });
      expect(result.transport).toEqual({ type: 'http', ws: true });
    });
  });

  describe('port', () => {
    it('should default to 8888 when not provided', () => {
      const result = validateConfig({ transport: { type: 'http' } });
      expect(result.port).toBe(8888);
    });

    it('should accept valid port number', () => {
      const result = validateConfig({ transport: { type: 'http' }, port: 3000 });
      expect(result.port).toBe(3000);
    });

    it('should coerce string port to number', () => {
      const result = validateConfig({ transport: { type: 'http' }, port: '3000' });
      expect(result.port).toBe(3000);
    });

    it('should throw an error for non-integer port', () => {
      expect(() => validateConfig({ transport: { type: 'http' }, port: 3000.5 })).toThrow();
    });
  });

  describe('host', () => {
    it('should default to localhost when not provided', () => {
      const result = validateConfig({ transport: { type: 'http' } });
      expect(result.host).toBe('localhost');
    });

    it('should accept valid host string', () => {
      const result = validateConfig({ transport: { type: 'http' }, host: '127.0.0.1' });
      expect(result.host).toBe('127.0.0.1');
    });
  });

  describe('auth', () => {
    it('should not include auth when not provided', () => {
      const result = validateConfig({ transport: { type: 'http' } });
      expect(result.auth).toBeUndefined();
    });

    it('should accept valid session auth configuration', () => {
      const result = validateConfig({
        transport: { type: 'http' },
        auth: { type: 'session', secret: 'mysecret' },
      });
      expect(result.auth).toEqual({
        type: 'session',
        secret: 'mysecret',
        name: 'connect.sid',
        resave: false,
        rolling: false,
        saveUninitialized: false,
        unset: 'keep',
      });
    });

    it('should accept valid bearer auth configuration', () => {
      const result = validateConfig({
        transport: { type: 'http' },
        auth: { type: 'bearer', secret: 'mysecret' },
      });
      expect(result.auth).toEqual({
        type: 'bearer',
        secret: 'mysecret',
        algorithm: 'HS256',
        expiresIn: '1h',
        noTimestamp: false,
        encoding: 'utf8',
      });
    });

    it('should throw an error for invalid auth type', () => {
      expect(() =>
        validateConfig({
          transport: { type: 'http' },
          auth: { type: 'invalid' },
        }),
      ).toThrow();
    });
  });

  describe('combined scenarios', () => {
    it('should accept a fully specified valid configuration', () => {
      const config = {
        transport: { type: 'https', cert: 'cert.pem', key: 'key.pem', ws: true },
        port: 3000,
        host: '127.0.0.1',
        auth: {
          type: 'bearer',
          secret: 'mysecret',
          algorithm: 'RS256',
          expiresIn: '2h',
        },
      };
      const result = validateConfig(config);
      expect(result).toEqual({
        ...config,
        auth: {
          ...config.auth,
          noTimestamp: false,
          encoding: 'utf8',
        },
      });
    });

    it('should accept a minimal valid configuration', () => {
      const config = { transport: { type: 'http' } };
      const result = validateConfig(config);
      expect(result).toEqual({
        transport: { type: 'http' },
        port: 8888,
        host: 'localhost',
      });
    });

    it('should throw an error for multiple invalid fields', () => {
      const config = {
        transport: { type: 'ftp' },
        port: 'invalid',
        auth: { type: 'invalid' },
      };
      expect(() => validateConfig(config)).toThrow();
    });
  });
});
