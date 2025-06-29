/**
 * Integration tests for MCP Server
 * Testing tool handlers and server lifecycle
 */

import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { StandardsServer } from '../../src/presentation/mcp-server.js';

describe('StandardsServer Integration', () => {
  let server;
  
  beforeEach(async () => {
    server = new StandardsServer();
    // Mock external calls for testing
    mock.method(server.standardsLoader, 'initialize', async () => {});
    mock.method(server.standardsLoader, 'getAllStandards', () => ({
      'test.md': { name: 'test.md', content: 'test content' }
    }));
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    mock.restoreAll();
  });

  test('should handle load_standards tool', async () => {
    const result = await server.handleLoadStandards({ force_refresh: false });
    
    assert.ok(result.content);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('Standards loaded successfully'));
  });

  test('should handle validate_content tool', async () => {
    const testContent = `
      import { config } from './config/index.js';
      
      function processData(input) {
        if (!input) throw new Error('Invalid input');
        return input.trim();
      }
    `;
    
    const result = await server.handleValidateContent({
      content: testContent,
      type: 'code'
    });
    
    assert.ok(result.content);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('Validation Results'));
  });

  test('should handle search_standards tool', async () => {
    const result = await server.handleSearchStandards({
      query: 'test'
    });
    
    assert.ok(result.content);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('Search Results'));
  });

  test('should handle get_standards_context tool', async () => {
    const result = await server.handleGetStandardsContext({
      interaction_type: 'development'
    });
    
    assert.ok(result.content);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('AI Development Standards Context'));
    assert.ok(result.content[0].text.includes('For Development Tasks'));
  });
});
