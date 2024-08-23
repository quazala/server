import { describe, it, expect } from "vitest";
import { createServerConfig, add } from "../src/main";

describe("createServerConfig", () => {
  it("should create a server configuration object", () => {
    const config = createServerConfig({ port: 3000 });
    expect(config).toHaveProperty("port", 3000);
    expect(config).toHaveProperty("start");
    expect(config).toHaveProperty("stop");
    expect(typeof config.start).toBe("function");
    expect(typeof config.stop).toBe("function");
  });

  it("should log start message when start is called", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const config = createServerConfig({ port: 3000 });
    config.start();
    expect(consoleSpy).toHaveBeenCalledWith("Server would start on port 3000");
    consoleSpy.mockRestore();
  });

  it("should log stop message when stop is called", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const config = createServerConfig({ port: 3000 });
    config.stop();
    expect(consoleSpy).toHaveBeenCalledWith("Server would stop");
    consoleSpy.mockRestore();
  });
});

describe("add", () => {
  it("should correctly add two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should correctly add a positive and a negative number", () => {
    expect(add(5, -3)).toBe(2);
  });

  it("should correctly add two negative numbers", () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it("should return 0 when adding 0 to 0", () => {
    expect(add(0, 0)).toBe(0);
  });
});
