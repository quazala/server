import { describe, expect, it } from 'vitest';
import { validateConfig } from '../src/config/config';

const CORS_DEFAULT_CONFIG = {
  AllowOrigin: ['*'],
  AllowMethods: ['*'],
  AllowHeaders: ['*'],
  ExposeHeaders: ['*'],
  AllowCredentials: true,
  MaxAge: 0,
};

describe('validateConfig', () => {
  it('should use default values when an empty configuration is provided', () => {
    const config = {};
    const result = validateConfig(config);

    expect(result).toEqual({
      proto: 'http',
      transport: ['http'],
      port: 8888,
      host: 'localhost',
      authStrategy: 'none',
      corsOptions: [CORS_DEFAULT_CONFIG],
    });
  });

  it('should validate a custom valid configuration', () => {
    const config = {
      proto: 'http',
      transport: ['http', 'ws'],
      port: 3000,
      host: '127.0.0.1',
      authStrategy: 'session',
      corsOptions: [
        {
          AllowOrigin: ['https://example.com'],
          AllowMethods: ['GET', 'POST'],
          AllowHeaders: ['Content-Type', 'Authorization'],
          ExposeHeaders: ['X-Custom-Header'],
          AllowCredentials: false,
          MaxAge: 600,
        },
      ],
    };
    const result = validateConfig(config);

    expect(result).toEqual(config);
  });

  it('should fail if authStrategy is not "none" and proto is not "http"', () => {
    const config = {
      proto: 'ws',
      authStrategy: 'session',
    };

    expect(() => validateConfig(config)).toThrow("Authentication strategies other than 'none' require the 'http' protocol");
  });

  it('should apply default CORS options if none are provided', () => {
    const config = {
      corsOptions: [],
    };
    const result = validateConfig(config);

    expect(result.corsOptions).toEqual([CORS_DEFAULT_CONFIG]);
  });

  it('should merge provided CORS options with defaults', () => {
    const config = {
      corsOptions: [
        {
          AllowMethods: ['GET', 'POST'],
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.corsOptions).toEqual([
      {
        AllowOrigin: ['*'],
        AllowMethods: ['GET', 'POST'],
        AllowHeaders: ['*'],
        ExposeHeaders: ['*'],
        AllowCredentials: true,
        MaxAge: 0,
      },
    ]);
  });

  it('should fail if transport array is empty', () => {
    const config = {
      transport: [],
    };

    expect(() => validateConfig(config)).toThrow('At least one transport method must be specified');
  });

  it('should coerce string port to number', () => {
    const config = {
      port: '3000',
    };
    const result = validateConfig(config);

    expect(result.port).toBe(3000);
  });

  it('should validate a complex configuration with multiple CORS options', () => {
    const config = {
      corsOptions: [
        {
          AllowOrigin: ['https://foo.com'],
        },
        {
          AllowOrigin: ['https://bar.com'],
          AllowMethods: ['GET'],
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.corsOptions).toEqual([
      {
        AllowOrigin: ['https://foo.com'],
        AllowMethods: ['*'],
        AllowHeaders: ['*'],
        ExposeHeaders: ['*'],
        AllowCredentials: true,
        MaxAge: 0,
      },
      {
        AllowOrigin: ['https://bar.com'],
        AllowMethods: ['GET'],
        AllowHeaders: ['*'],
        ExposeHeaders: ['*'],
        AllowCredentials: true,
        MaxAge: 0,
      },
    ]);
  });
});
