# MCP Server API Documentation

## 🚀 AI Development Standards MCP Server Tools

This MCP server provides 5 core tools for automated standards integration:

---

## 📚 load_standards

**Description:** Load and refresh AI development standards from repository

**Parameters:**
- `force_refresh` (boolean, optional): Force refresh even if cache is valid

**Returns:** Success message with file count and categories

**Example:**
```json
{
  "name": "load_standards",
  "arguments": {
    "force_refresh": false
  }
}
```

---

## 🔍 validate_content

**Description:** Validate content against AI development standards

**Parameters:**
- `content` (string, required): Content to validate (code, documentation, etc.)
- `type` (string, optional): Type of content - "code", "documentation", "architecture", "process"
- `context` (object, optional): Additional context for validation

**Returns:** Validation results with score, issues, and recommendations

**Example:**
```json
{
  "name": "validate_content",
  "arguments": {
    "content": "import { config } from './config/index.js';",
    "type": "code",
    "context": {
      "project_type": "mcp-server"
    }
  }
}
```

---

## 📋 get_checklist

**Description:** Get relevant checklist for development task

**Parameters:**
- `task_type` (string, required): Type of development task - "pre-development", "code-review", "merge", "deployment"
- `context` (object, optional): Additional context for checklist selection

**Returns:** Formatted checklist with actionable items

**Example:**
```json
{
  "name": "get_checklist",
  "arguments": {
    "task_type": "pre-development",
    "context": {
      "project_type": "api"
    }
  }
}
```

---

## 🔍 search_standards

**Description:** Search development standards for specific topics

**Parameters:**
- `query` (string, required): Search query for standards content
- `category` (string, optional): Specific category - "architecture", "security", "checklists", "templates", "docs"

**Returns:** Ranked search results with excerpts

**Example:**
```json
{
  "name": "search_standards",
  "arguments": {
    "query": "modular design",
    "category": "architecture"
  }
}
```

---

## 🎯 get_standards_context

**Description:** Get complete standards context for AI interaction

**Parameters:**
- `interaction_type` (string, optional): Type of AI interaction - "development", "review", "planning", "troubleshooting"

**Returns:** Comprehensive context with relevant guidelines

**Example:**
```json
{
  "name": "get_standards_context",
  "arguments": {
    "interaction_type": "development"
  }
}
```

---

## 🔄 Usage Patterns

### **Session Initialization**
```
1. load_standards (force_refresh: false)
2. get_standards_context (interaction_type: "development")
```

### **Code Validation Workflow**
```
1. validate_content (content: code, type: "code")
2. search_standards (query: specific issue found)
3. get_checklist (task_type: "code-review")
```

### **Project Planning Workflow**
```
1. get_checklist (task_type: "pre-development")
2. search_standards (query: "architecture requirements")
3. get_standards_context (interaction_type: "planning")
```

---

## 🛡️ Error Handling

All tools include comprehensive error handling:

- **Invalid parameters**: Clear error messages with suggestions
- **Network failures**: Graceful degradation with cached data
- **Validation errors**: Detailed feedback with specific recommendations
- **Missing data**: Helpful guidance on available alternatives

---

## 🔧 Configuration

The server behavior can be configured via environment variables:

- `GITHUB_TOKEN`: For accessing private repositories
- `STANDARDS_CACHE_TTL`: Cache validity duration (seconds)
- `STANDARDS_AUTO_UPDATE`: Automatic standards refresh
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

See `.env.example` for complete configuration options.
