/**
 * Creates a server configuration
 * @param {Object} options - Server options
 * @param {number} options.port - Port number
 * @returns {Object} Server configuration object
 */
export function createServerConfig(options) {
  return {
    port: options.port,
    start: () => console.log(`Server would start on port ${options.port}`),
    stop: () => console.log("Server would stop"),
  };
}
/**
 * Adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
export function add(a, b) {
  return a + b;
}
