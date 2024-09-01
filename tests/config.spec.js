import { describe, expect, it } from 'vitest';
import { corsDefaultConfig, validateConfig } from '../src/config/config';

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

    it('should accept ws as a valid value', () => {
      const result = validateConfig({ proto: 'ws' });
      expect(result.proto).toBe('ws');
    });

    it('should accept https as a valid value', () => {
      const result = validateConfig({ proto: 'https' });
      expect(result.proto).toBe('https');
    });

    it('should throw an error for invalid proto value', () => {
      expect(() => validateConfig({ proto: 'invalid' })).toThrow();
    });
  });

  describe('transport', () => {
    it('should default to ["http"] when not provided', () => {
      const result = validateConfig({});
      expect(result.transport).toEqual(['http']);
    });

    it('should accept valid single transport value', () => {
      const result = validateConfig({ transport: ['http'] });
      expect(result.transport).toEqual(['http']);
    });

    it('should accept valid multiple transport values', () => {
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

    it('should throw an error for negative port', () => {
      expect(() => validateConfig({ port: -1 })).toThrow();
    });

    it('should throw an error for port number out of range', () => {
      expect(() => validateConfig({ port: 65536 })).toThrow();
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

    it('should accept valid domain name', () => {
      const result = validateConfig({ host: 'example.com' });
      expect(result.host).toBe('example.com');
    });

    it('should throw an error for empty host string', () => {
      expect(() => validateConfig({ host: '' })).toThrow();
    });
  });

  describe('authStrategy', () => {
    it('should default to none when not provided', () => {
      const result = validateConfig({});
      expect(result.authStrategy).toBe('none');
    });

    it('should accept none as a valid value', () => {
      const result = validateConfig({ authStrategy: 'none' });
      expect(result.authStrategy).toBe('none');
    });

    it('should accept session as a valid value with http proto', () => {
      const result = validateConfig({ authStrategy: 'session', proto: 'http' });
      expect(result.authStrategy).toBe('session');
    });

    it('should accept bearer as a valid value with http proto', () => {
      const result = validateConfig({ authStrategy: 'bearer', proto: 'http' });
      expect(result.authStrategy).toBe('bearer');
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

  describe('corsOptions', () => {
    it('should use default corsOptions when not provided', () => {
      const result = validateConfig({});
      expect(result.corsOptions).toEqual([corsDefaultConfig]);
    });

    it('should accept valid corsOptions', () => {
      const customCorsOptions = {
        AllowOrigin: ['http://example.com'],
        AllowMethods: ['GET', 'POST'],
        AllowHeaders: ['Content-Type'],
        ExposeHeaders: ['X-Custom-Header'],
        AllowCredentials: false,
        MaxAge: 3600,
      };
      const result = validateConfig({ corsOptions: [customCorsOptions] });
      expect(result.corsOptions).toEqual([{ ...corsDefaultConfig, ...customCorsOptions }]);
    });

    it('should merge multiple corsOptions', () => {
      const corsOptions1 = { AllowOrigin: ['http://example1.com'] };
      const corsOptions2 = { AllowOrigin: ['http://example2.com'] };
      const result = validateConfig({ corsOptions: [corsOptions1, corsOptions2] });
      expect(result.corsOptions).toEqual([
        { ...corsDefaultConfig, ...corsOptions1 },
        { ...corsDefaultConfig, ...corsOptions2 },
      ]);
    });

    it('should throw an error for invalid AllowMethods', () => {
      expect(() => validateConfig({ corsOptions: [{ AllowMethods: ['INVALID'] }] })).toThrow();
    });

    it('should throw an error for non-boolean AllowCredentials', () => {
      expect(() => validateConfig({ corsOptions: [{ AllowCredentials: 'yes' }] })).toThrow();
    });

    it('should throw an error for negative MaxAge', () => {
      expect(() => validateConfig({ corsOptions: [{ MaxAge: -1 }] })).toThrow();
    });
  });

  describe('combined scenarios', () => {
    it('should accept a fully specified valid configuration', () => {
      const config = {
        apiType: 'rest',
        proto: 'http',
        transport: ['http', 'ws'],
        port: 3000,
        host: '127.0.0.1',
        authStrategy: 'bearer',
        corsOptions: [
          {
            AllowOrigin: ['http://example.com'],
            AllowMethods: ['GET', 'POST'],
            AllowHeaders: ['Content-Type'],
            ExposeHeaders: ['X-Custom-Header'],
            AllowCredentials: false,
            MaxAge: 3600,
          },
        ],
      };
      const result = validateConfig(config);
      expect(result).toEqual({
        ...config,
        corsOptions: [{ ...corsDefaultConfig, ...config.corsOptions[0] }],
      });
    });

    it('should throw an error for multiple invalid fields', () => {
      const config = {
        proto: 'invalid',
        transport: [],
        port: 'invalid',
        authStrategy: 'invalid',
        corsOptions: [{ MaxAge: -1 }],
      };
      expect(() => validateConfig(config)).toThrow();
    });

    it('should handle edge case with minimum allowed port', () => {
      const result = validateConfig({ port: 1 });
      expect(result.port).toBe(1);
    });

    it('should handle edge case with maximum allowed port', () => {
      const result = validateConfig({ port: 65535 });
      expect(result.port).toBe(65535);
    });

    it('should handle https protocol with non-default port', () => {
      const result = validateConfig({ proto: 'https', port: 443 });
      expect(result.proto).toBe('https');
      expect(result.port).toBe(443);
    });

    it('should handle ws protocol with non-default port', () => {
      const result = validateConfig({ proto: 'ws', port: 8080 });
      expect(result.proto).toBe('ws');
      expect(result.port).toBe(8080);
    });
  });
});
