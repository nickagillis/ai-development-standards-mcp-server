/**
 * Unit tests for StandardsLoader
 * Testing core functionality with proper mocking
 */

import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StandardsLoader } from '../../src/data/standards-loader.js';

// Mock external dependencies
const mockFetch = mock.fn();
const mockFs = {
  mkdir: mock.fn(),
  readFile: mock.fn(),
  writeFile: mock.fn(),
  access: mock.fn()
};

// Mock modules
mock.method(globalThis, 'fetch', mockFetch);

describe('StandardsLoader', () => {
  let loader;
  
  beforeEach(() => {
    loader = new StandardsLoader();
    mock.restoreAll();
  });

  test('should initialize with empty cache', () => {
    assert.strictEqual(loader.cache.size, 0);
    assert.strictEqual(loader.lastUpdate, null);
    assert.strictEqual(loader.isLoading, false);
  });

  test('should calculate relevance score correctly', () => {
    const content = 'This is a test document about architecture and validation';
    const query = 'architecture test';
    
    const score = loader.calculateRelevance(content, query);
    assert.ok(score > 0, 'Should return positive relevance score');
  });

  test('should search standards by content', () => {
    // Setup mock standards
    loader.cache.set('standards', {
      'test/file1.md': {
        name: 'file1.md',
        content: 'This file contains architecture guidelines'
      },
      'test/file2.md': {
        name: 'file2.md', 
        content: 'This file contains security protocols'
      }
    });

    const results = loader.searchStandards('architecture');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'file1.md');
  });

  test('should handle empty search results', () => {
    loader.cache.set('standards', {});
    const results = loader.searchStandards('nonexistent');
    assert.strictEqual(results.length, 0);
  });
});
