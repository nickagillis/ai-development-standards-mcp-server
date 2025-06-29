#!/usr/bin/env node

/**
 * AI Development Standards MCP Server
 * Entry point following modular architecture requirements
 */

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { StandardsServer } from './presentation/mcp-server.js';

class Application {
  constructor() {
    this.server = null;
    this.isShuttingDown = false;
  }

  async start() {
    try {
      logger.info('🚀 Starting AI Development Standards MCP Server', {
        version: config.server.version,
        environment: config.server.environment
      });

      // Initialize MCP server
      this.server = new StandardsServer();
      await this.server.start();

      logger.info('✅ Server started successfully', {
        port: config.server.port,
        name: config.mcp.serverName
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  async stop() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.info('🔄 Shutting down server gracefully...');

    try {
      if (this.server) {
        await this.server.stop();
      }
      logger.info('✅ Server stopped successfully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`📡 Received ${signal}, initiating graceful shutdown`);
        this.stop();
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception', { error: error.message, stack: error.stack });
      this.stop();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection', { reason, promise });
      this.stop();
    });
  }
}

// Start the application
const app = new Application();
app.start();
