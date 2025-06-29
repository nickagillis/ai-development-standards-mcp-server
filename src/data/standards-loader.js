/**
 * Standards Loading and Caching
 * Handles fetching, caching, and updating development standards
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import fetch from 'node-fetch';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class StandardsLoader {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
    this.isLoading = false;
  }

  /**
   * Initialize standards loader
   */
  async initialize() {
    try {
      // Ensure cache directory exists
      await mkdir(config.standards.cacheDir, { recursive: true });
      
      // Load cached standards if available
      await this.loadFromCache();
      
      // Auto-update if enabled
      if (config.standards.autoUpdate) {
        await this.loadStandards();
      }
      
      logger.info('📚 Standards loader initialized', {
        cacheSize: this.cache.size,
        lastUpdate: this.lastUpdate
      });
    } catch (error) {
      logger.error('❌ Failed to initialize standards loader', { error: error.message });
      throw error;
    }
  }

  /**
   * Load standards from GitHub repository
   */
  async loadStandards() {
    if (this.isLoading) {
      logger.debug('⏳ Standards loading already in progress');
      return;
    }

    this.isLoading = true;
    
    try {
      logger.info('🔄 Loading standards from GitHub repository');
      
      // Get repository structure
      const repoContents = await this.fetchGitHubAPI(`/repos/${config.github.owner}/${config.github.repo}/contents`);
      
      // Load all markdown files
      const standards = await this.loadMarkdownFiles(repoContents);
      
      // Cache the loaded standards
      this.cache.set('standards', standards);
      this.lastUpdate = new Date();
      
      // Save to disk cache
      await this.saveToCache();
      
      logger.info('✅ Standards loaded successfully', {
        fileCount: Object.keys(standards).length,
        timestamp: this.lastUpdate
      });
      
    } catch (error) {
      logger.error('❌ Failed to load standards', { error: error.message });
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Recursively load markdown files from repository
   */
  async loadMarkdownFiles(contents, basePath = '') {
    const standards = {};
    
    for (const item of contents) {
      const fullPath = basePath ? `${basePath}/${item.name}` : item.name;
      
      if (item.type === 'dir') {
        // Recursively load directory contents
        const dirContents = await this.fetchGitHubAPI(`/repos/${config.github.owner}/${config.github.repo}/contents/${item.path}`);
        const dirStandards = await this.loadMarkdownFiles(dirContents, fullPath);
        Object.assign(standards, dirStandards);
      } else if (item.name.endsWith('.md')) {
        // Load markdown file content
        const fileContent = await this.fetchGitHubAPI(`/repos/${config.github.owner}/${config.github.repo}/contents/${item.path}`);
        
        if (fileContent.content) {
          const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
          standards[fullPath] = {
            path: fullPath,
            name: item.name,
            content,
            sha: fileContent.sha,
            size: fileContent.size,
            lastModified: new Date()
          };
        }
      }
    }
    
    return standards;
  }

  /**
   * Fetch data from GitHub API
   */
  async fetchGitHubAPI(endpoint) {
    const url = `${config.github.apiUrl}${endpoint}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': `${config.mcp.serverName}/${config.server.version}`
    };
    
    if (config.github.token) {
      headers['Authorization'] = `token ${config.github.token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Save standards to disk cache
   */
  async saveToCache() {
    try {
      const cacheFile = join(config.standards.cacheDir, 'standards.json');
      const cacheData = {
        standards: Object.fromEntries(this.cache),
        lastUpdate: this.lastUpdate,
        version: config.server.version
      };
      
      await writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
      logger.debug('💾 Standards cached to disk');
    } catch (error) {
      logger.warn('⚠️ Failed to save standards cache', { error: error.message });
    }
  }

  /**
   * Load standards from disk cache
   */
  async loadFromCache() {
    try {
      const cacheFile = join(config.standards.cacheDir, 'standards.json');
      await access(cacheFile);
      
      const cacheData = JSON.parse(await readFile(cacheFile, 'utf-8'));
      
      // Check cache validity
      const cacheAge = Date.now() - new Date(cacheData.lastUpdate).getTime();
      if (cacheAge < config.standards.cacheTtl * 1000) {
        this.cache = new Map(Object.entries(cacheData.standards));
        this.lastUpdate = new Date(cacheData.lastUpdate);
        logger.info('📦 Loaded standards from cache', { age: Math.round(cacheAge / 1000) + 's' });
        return true;
      } else {
        logger.info('⏰ Cache expired, will refresh standards');
        return false;
      }
    } catch (error) {
      logger.debug('📦 No valid cache found, will load fresh standards');
      return false;
    }
  }

  /**
   * Get specific standard by path
   */
  getStandard(path) {
    const standards = this.cache.get('standards') || {};
    return standards[path];
  }

  /**
   * Get all standards
   */
  getAllStandards() {
    return this.cache.get('standards') || {};
  }

  /**
   * Search standards by content
   */
  searchStandards(query) {
    const standards = this.getAllStandards();
    const results = [];
    
    for (const [path, standard] of Object.entries(standards)) {
      if (standard.content.toLowerCase().includes(query.toLowerCase()) ||
          standard.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          path,
          name: standard.name,
          relevance: this.calculateRelevance(standard.content, query)
        });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(content, query) {
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    
    let score = 0;
    for (const queryWord of queryWords) {
      const matches = contentWords.filter(word => word.includes(queryWord)).length;
      score += matches;
    }
    
    return score;
  }
}
