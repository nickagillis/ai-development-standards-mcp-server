# Configuration Guide

## 🚀 AI Development Standards MCP Server Configuration

### 📋 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 🔧 Core Configuration

#### **Server Settings**
```env
PORT=3000                    # Server port (not used in MCP mode)
NODE_ENV=development         # Environment: development|production
```

#### **GitHub Integration** (Required)
```env
GITHUB_TOKEN=your_token_here          # Personal access token
GITHUB_OWNER=nickagillis              # Repository owner
GITHUB_REPO=ai-development-standards  # Repository name
```

**GitHub Token Setup:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Add token to `.env` file

#### **Standards Management**
```env
STANDARDS_CACHE_TTL=3600        # Cache lifetime (seconds)
STANDARDS_AUTO_UPDATE=true      # Auto-refresh on startup
STANDARDS_VALIDATION_STRICT=false  # Strict validation mode
```

#### **MCP Configuration**
```env
MCP_SERVER_NAME=ai-development-standards  # Server identifier
MCP_MAX_CONCURRENT_SESSIONS=10           # Connection limit
```

#### **Logging**
```env
LOG_LEVEL=info              # debug|info|warn|error
LOG_FORMAT=json             # json|simple
```

### 🛡️ Security Configuration

```env
RATE_LIMIT_REQUESTS=100     # Requests per window
RATE_LIMIT_WINDOW=3600      # Window duration (seconds)
API_KEY_REQUIRED=false      # Require API key authentication
```

### 🔮 Future Features

```env
# Community Wisdom Engine (Red Zone - Experimental)
CWE_ENABLED=false                              # Enable CWE integration
CWE_ENDPOINT=https://api.community-wisdom.example.com
CWE_API_KEY=your_cwe_api_key_here
```

---

## 🏗️ MCP Client Configuration

### **Claude Desktop Integration**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-development-standards": {
      "command": "node",
      "args": ["/path/to/ai-development-standards-mcp-server/src/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_token_here",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### **Custom MCP Client**

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./src/index.js'],
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    NODE_ENV: 'production'
  }
});

const client = new Client({
  name: "standards-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);
```

---

## ⚡ Performance Tuning

### **Cache Optimization**
```env
# Longer cache for stable environments
STANDARDS_CACHE_TTL=7200  # 2 hours

# Shorter cache for active development
STANDARDS_CACHE_TTL=900   # 15 minutes
```

### **Connection Limits**
```env
# High-traffic environments
MCP_MAX_CONCURRENT_SESSIONS=50

# Resource-constrained environments
MCP_MAX_CONCURRENT_SESSIONS=5
```

### **Logging in Production**
```env
LOG_LEVEL=warn            # Reduce log noise
LOG_FORMAT=json           # Structured logging
```

---

## 🔧 Troubleshooting

### **Common Issues**

**GitHub API Rate Limits:**
- Use authenticated requests with `GITHUB_TOKEN`
- Increase `STANDARDS_CACHE_TTL` to reduce API calls

**Standards Not Loading:**
- Verify `GITHUB_TOKEN` has repository access
- Check `GITHUB_OWNER` and `GITHUB_REPO` values
- Enable debug logging: `LOG_LEVEL=debug`

**MCP Connection Issues:**
- Ensure proper file permissions on server script
- Verify Node.js version compatibility (>=18.0.0)
- Check MCP client configuration syntax

### **Debug Mode**

```env
LOG_LEVEL=debug
STANDARDS_VALIDATION_STRICT=true
```

Run with debug output:
```bash
DEBUG=* npm start
```

---

## 📊 Monitoring

### **Health Checks**

Use the `load_standards` tool to verify server health:

```json
{
  "name": "load_standards",
  "arguments": {
    "force_refresh": true
  }
}
```

### **Performance Metrics**

- Standards load time
- Cache hit ratio
- Validation response time
- Search query performance

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment-specific configurations**
3. **Regularly rotate GitHub tokens**
4. **Monitor access logs** in production
5. **Restrict repository access** to minimum required scope

---

*For additional configuration questions, see the [Development Guide](development.md)*
