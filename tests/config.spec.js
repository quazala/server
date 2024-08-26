import { describe, expect, it } from 'vitest';
import { validateConfig } from '../src/config/config';

describe('validateConfig', () => {
  describe('proto', () => {
    it('should default to http when not provided', () => {
      const result = validateConfig({});
      expect(result.proto).toBe('http');
    });

    it('should accept http as a valid value', () => {
      const result = validateConfig({ proto: 'http' });
      expect(result.proto).toBe('http');
    });

    it('should accept ws as a valid value when authStrategy is none', () => {
      const result = validateConfig({ proto: 'ws', authStrategy: 'none' });
      expect(result.proto).toBe('ws');
    });
  });

  describe('transport', () => {
    it('should default to ["http"] when not provided', () => {
      const result = validateConfig({});
      expect(result.transport).toEqual(['http']);
    });

    it('should accept valid transport values', () => {
      const result = validateConfig({ transport: ['http', 'ws'] });
      expect(result.transport).toEqual(['http', 'ws']);
    });

    it('should throw an error for empty transport array', () => {
      expect(() => validateConfig({ transport: [] })).toThrow('At least one transport method must be specified');
    });

    it('should throw an error for invalid transport value', () => {
      expect(() => validateConfig({ transport: ['http', 'invalid'] })).toThrow();
    });
  });

  describe('port', () => {
    it('should default to 8888 when not provided', () => {
      const result = validateConfig({});
      expect(result.port).toBe(8888);
    });

    it('should accept valid port number', () => {
      const result = validateConfig({ port: 3000 });
      expect(result.port).toBe(3000);
    });

    it('should coerce string port to number', () => {
      const result = validateConfig({ port: '3000' });
      expect(result.port).toBe(3000);
    });

    it('should throw an error for non-integer port', () => {
      expect(() => validateConfig({ port: 3000.5 })).toThrow();
    });
  });

  describe('host', () => {
    it('should default to localhost when not provided', () => {
      const result = validateConfig({});
      expect(result.host).toBe('localhost');
    });

    it('should accept valid host string', () => {
      const result = validateConfig({ host: '127.0.0.1' });
      expect(result.host).toBe('127.0.0.1');
    });
  });

  describe('authStrategy', () => {
    it('should default to none when not provided', () => {
      const result = validateConfig({});
      expect(result.authStrategy).toBe('none');
    });

    it('should accept valid authStrategy values with http proto', () => {
      const result = validateConfig({ authStrategy: 'session', proto: 'http' });
      expect(result.authStrategy).toBe('session');
    });

    it('should throw an error for invalid authStrategy value', () => {
      expect(() => validateConfig({ authStrategy: 'invalid' })).toThrow();
    });

    it('should throw an error when using non-none authStrategy with non-http proto', () => {
      expect(() => validateConfig({ authStrategy: 'bearer', proto: 'ws' })).toThrow(
        "Authentication strategies other than 'none' require the 'http' protocol",
      );
    });
  });

  describe('combined scenarios', () => {
    it('should accept a fully specified valid configuration', () => {
      const config = {
        proto: 'http',
        transport: ['http', 'ws'],
        port: 3000,
        host: '127.0.0.1',
        authStrategy: 'bearer',
      };
      const result = validateConfig(config);
      expect(result).toEqual(config);
    });

    it('should accept a minimal valid configuration', () => {
      const config = {};
      const result = validateConfig(config);
      expect(result).toEqual({
        proto: 'http',
        transport: ['http'],
        port: 8888,
        host: 'localhost',
        authStrategy: 'none',
      });
    });

    it('should throw an error for multiple invalid fields', () => {
      const config = {
        proto: 'ws',
        transport: [],
        port: 'invalid',
        authStrategy: 'bearer',
      };
      expect(() => validateConfig(config)).toThrow();
    });
  });
});
