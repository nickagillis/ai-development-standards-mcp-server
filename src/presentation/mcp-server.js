/**
 * MCP Server Implementation
 * Handles MCP protocol communication and client interactions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { StandardsLoader } from '../data/standards-loader.js';
import { StandardsValidator } from '../business/standards-validator.js';

export class StandardsServer {
  constructor() {
    this.server = new Server(
      {
        name: config.mcp.serverName,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.standardsLoader = new StandardsLoader();
    this.validator = new StandardsValidator(this.standardsLoader);
    this.setupHandlers();
  }

  /**
   * Setup MCP server handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "load_standards",
          description: "Load and refresh AI development standards from repository",
          inputSchema: {
            type: "object",
            properties: {
              force_refresh: {
                type: "boolean",
                description: "Force refresh even if cache is valid",
                default: false
              }
            }
          }
        },
        {
          name: "validate_content",
          description: "Validate content against AI development standards",
          inputSchema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Content to validate (code, documentation, etc.)"
              },
              type: {
                type: "string",
                description: "Type of content (code, documentation, architecture)",
                enum: ["code", "documentation", "architecture", "process"]
              },
              context: {
                type: "object",
                description: "Additional context for validation"
              }
            },
            required: ["content"]
          }
        },
        {
          name: "get_checklist",
          description: "Get relevant checklist for development task",
          inputSchema: {
            type: "object",
            properties: {
              task_type: {
                type: "string",
                description: "Type of development task",
                enum: ["pre-development", "code-review", "merge", "deployment"]
              },
              context: {
                type: "object",
                description: "Additional context for checklist selection"
              }
            },
            required: ["task_type"]
          }
        },
        {
          name: "search_standards",
          description: "Search development standards for specific topics",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for standards content"
              },
              category: {
                type: "string",
                description: "Specific category to search in",
                enum: ["architecture", "security", "checklists", "templates", "docs"]
              }
            },
            required: ["query"]
          }
        },
        {
          name: "get_standards_context",
          description: "Get complete standards context for AI interaction",
          inputSchema: {
            type: "object",
            properties: {
              interaction_type: {
                type: "string",
                description: "Type of AI interaction",
                enum: ["development", "review", "planning", "troubleshooting"]
              }
            }
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "load_standards":
            return await this.handleLoadStandards(args);
          
          case "validate_content":
            return await this.handleValidateContent(args);
          
          case "get_checklist":
            return await this.handleGetChecklist(args);
          
          case "search_standards":
            return await this.handleSearchStandards(args);
          
          case "get_standards_context":
            return await this.handleGetStandardsContext(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('🔧 Tool execution failed', {
          tool: name,
          error: error.message,
          args
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`
            }
          ]
        };
      }
    });

    logger.info('🔧 MCP server handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      // Initialize standards loader
      await this.standardsLoader.initialize();
      
      // Start MCP server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('🚀 MCP server started successfully');
    } catch (error) {
      logger.error('❌ Failed to start MCP server', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    try {
      await this.server.close();
      logger.info('🛑 MCP server stopped');
    } catch (error) {
      logger.error('❌ Error stopping MCP server', { error: error.message });
      throw error;
    }
  }

  // Tool handlers

  async handleLoadStandards(args) {
    const { force_refresh = false } = args;
    
    if (force_refresh) {
      await this.standardsLoader.loadStandards();
    } else {
      // Load will check cache validity automatically
      await this.standardsLoader.initialize();
    }
    
    const standards = this.standardsLoader.getAllStandards();
    const fileCount = Object.keys(standards).length;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Standards loaded successfully!\n\n📚 **Loaded ${fileCount} standard files**\n\n**Available categories:**\n- Architecture requirements\n- Development checklists\n- Security guidelines\n- Project templates\n- Experimental dependencies\n- Community wisdom engine\n\n*Last updated: ${this.standardsLoader.lastUpdate}*`
        }
      ]
    };
  }

  async handleValidateContent(args) {
    const { content, type = 'code', context = {} } = args;
    
    const results = await this.validator.validateContent(content, { type, ...context });
    
    let resultText = `🔍 **Validation Results**\n\n`;
    resultText += `**Score: ${results.score}%** (${results.passed} passed, ${results.failed} failed)\n\n`;
    
    if (results.issues.length > 0) {
      resultText += `**Issues Found:**\n`;
      results.issues.forEach((issue, index) => {
        const emoji = issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : '💡';
        resultText += `${index + 1}. ${emoji} **${issue.description}**\n`;
        resultText += `   ${issue.message}\n`;
        if (issue.suggestion) {
          resultText += `   💡 *Suggestion: ${issue.suggestion}*\n`;
        }
        resultText += `\n`;
      });
    }
    
    if (results.recommendations.length > 0) {
      resultText += `**Recommendations:**\n`;
      results.recommendations.forEach((rec, index) => {
        resultText += `${index + 1}. ${rec}\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: resultText
        }
      ]
    };
  }

  async handleGetChecklist(args) {
    const { task_type, context = {} } = args;
    
    const checklist = await this.validator.getRelevantChecklist(task_type, context);
    
    if (!checklist) {
      return {
        content: [
          {
            type: "text",
            text: `❌ No checklist found for task type: ${task_type}\n\nAvailable task types: pre-development, code-review, merge, deployment`
          }
        ]
      };
    }
    
    let checklistText = `📋 **${checklist.name}**\n\n`;
    checklistText += `*Source: ${checklist.path}*\n\n`;
    
    if (checklist.applicableItems.length > 0) {
      checklistText += `**Checklist Items:**\n`;
      checklist.applicableItems.forEach((item, index) => {
        checklistText += `${index + 1}. ☐ ${item.text}\n`;
      });
    } else {
      // Fallback to full content if items extraction failed
      checklistText += checklist.content;
    }
    
    return {
      content: [
        {
          type: "text",
          text: checklistText
        }
      ]
    };
  }

  async handleSearchStandards(args) {
    const { query, category } = args;
    
    let searchResults;
    if (category) {
      // Search within specific category
      const categoryStandards = this.standardsLoader.searchStandards(category);
      searchResults = categoryStandards.filter(result => 
        this.standardsLoader.getStandard(result.path).content.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      searchResults = this.standardsLoader.searchStandards(query);
    }
    
    if (searchResults.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `🔍 No results found for query: "${query}"\n\nTry searching for terms like:\n- architecture\n- security\n- checklist\n- validation\n- experimental`
          }
        ]
      };
    }
    
    let resultText = `🔍 **Search Results for "${query}"**\n\n`;
    resultText += `Found ${searchResults.length} relevant standards:\n\n`;
    
    searchResults.slice(0, 10).forEach((result, index) => {
      const standard = this.standardsLoader.getStandard(result.path);
      resultText += `${index + 1}. **${result.name}**\n`;
      resultText += `   📄 *${result.path}*\n`;
      resultText += `   🎯 Relevance: ${result.relevance}\n`;
      
      // Show excerpt
      const excerpt = standard.content.substring(0, 200).replace(/\n/g, ' ') + '...';
      resultText += `   📝 ${excerpt}\n\n`;
    });
    
    return {
      content: [
        {
          type: "text",
          text: resultText
        }
      ]
    };
  }

  async handleGetStandardsContext(args) {
    const { interaction_type = 'development' } = args;
    
    const standards = this.standardsLoader.getAllStandards();
    const totalFiles = Object.keys(standards).length;
    
    let contextText = `🚀 **AI Development Standards Context**\n\n`;
    contextText += `📚 **Loaded Standards:** ${totalFiles} files\n`;
    contextText += `⏰ **Last Updated:** ${this.standardsLoader.lastUpdate}\n`;
    contextText += `🎯 **Interaction Type:** ${interaction_type}\n\n`;
    
    // Provide relevant context based on interaction type
    switch (interaction_type) {
      case 'development':
        contextText += `**🏗️ For Development Tasks:**\n`;
        contextText += `- Follow modular architecture with clear separation of concerns\n`;
        contextText += `- Use configuration-driven development\n`;
        contextText += `- Implement production-ready error handling\n`;
        contextText += `- Always use feature branches (never commit to main)\n`;
        contextText += `- Include comprehensive testing and documentation\n\n`;
        break;
        
      case 'review':
        contextText += `**👀 For Code Review:**\n`;
        contextText += `- Check architecture requirements compliance\n`;
        contextText += `- Verify security guidelines are followed\n`;
        contextText += `- Ensure proper documentation is included\n`;
        contextText += `- Validate testing coverage\n`;
        contextText += `- Review for experimental dependency safety\n\n`;
        break;
        
      case 'planning':
        contextText += `**📋 For Project Planning:**\n`;
        contextText += `- Follow pre-development checklist\n`;
        contextText += `- Plan modular architecture from start\n`;
        contextText += `- Consider security requirements early\n`;
        contextText += `- Design for MCP-friendly structure\n`;
        contextText += `- Plan testing and deployment strategy\n\n`;
        break;
        
      case 'troubleshooting':
        contextText += `**🔧 For Troubleshooting:**\n`;
        contextText += `- Check merge readiness validation\n`;
        contextText += `- Verify configuration consistency\n`;
        contextText += `- Review error handling implementation\n`;
        contextText += `- Validate input sanitization\n`;
        contextText += `- Check experimental dependency safety\n\n`;
        break;
    }
    
    // Add key standards summary
    contextText += `**📖 Key Standards Available:**\n`;
    
    const keyStandards = [
      'README.md',
      'architecture/requirements.md',
      'checklists/pre-development.md',
      'checklists/merge-readiness.md',
      'docs/security.md',
      'docs/experimental-dependencies.md'
    ];
    
    keyStandards.forEach(path => {
      if (standards[path]) {
        contextText += `- ${path}\n`;
      }
    });
    
    contextText += `\n*Use search_standards or get_checklist tools for specific guidance*`;
    
    return {
      content: [
        {
          type: "text",
          text: contextText
        }
      ]
    };
  }
}
