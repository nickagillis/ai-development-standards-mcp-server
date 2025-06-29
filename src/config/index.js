/**
 * Configuration Management
 * Single source of truth for all server configuration
 * Following configuration-driven development principles
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = ['NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get environment variable with type conversion and defaults
 */
function getEnvVar(key, defaultValue = null, type = 'string') {
  const value = process.env[key] || defaultValue;
  
  if (value === null) {
    return null;
  }
  
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1';
    case 'array':
      return value.split(',').map(item => item.trim());
    default:
      return value;
  }
}

// Validate configuration
validateConfig();

/**
 * Main configuration object
 * Organized by functional areas for clarity
 */
export const config = {
  // Server configuration
  server: {
    port: getEnvVar('PORT', 3000, 'number'),
    environment: getEnvVar('NODE_ENV', 'development'),
    version: getEnvVar('MCP_SERVER_VERSION', '1.0.0'),
    rootDir
  },

  // GitHub integration for standards loading
  github: {
    token: getEnvVar('GITHUB_TOKEN'),
    owner: getEnvVar('GITHUB_OWNER', 'nickagillis'),
    repo: getEnvVar('GITHUB_REPO', 'ai-development-standards'),
    apiUrl: 'https://api.github.com'
  },

  // Standards management
  standards: {
    cacheTtl: getEnvVar('STANDARDS_CACHE_TTL', 3600, 'number'),
    autoUpdate: getEnvVar('STANDARDS_AUTO_UPDATE', true, 'boolean'),
    validationStrict: getEnvVar('STANDARDS_VALIDATION_STRICT', false, 'boolean'),
    cacheDir: join(rootDir, '.standards-cache')
  },

  // MCP server configuration
  mcp: {
    serverName: getEnvVar('MCP_SERVER_NAME', 'ai-development-standards'),
    maxConcurrentSessions: getEnvVar('MCP_MAX_CONCURRENT_SESSIONS', 10, 'number')
  },

  // Logging configuration
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json')
  },

  // Security configuration
  security: {
    rateLimitRequests: getEnvVar('RATE_LIMIT_REQUESTS', 100, 'number'),
    rateLimitWindow: getEnvVar('RATE_LIMIT_WINDOW', 3600, 'number'),
    apiKeyRequired: getEnvVar('API_KEY_REQUIRED', false, 'boolean')
  },

  // Future: Community Wisdom Engine
  cwe: {
    enabled: getEnvVar('CWE_ENABLED', false, 'boolean'),
    endpoint: getEnvVar('CWE_ENDPOINT'),
    apiKey: getEnvVar('CWE_API_KEY')
  }
};

// Export individual sections for convenience
export const { server, github, standards, mcp, logging, security, cwe } = config;
