/**
 * Server validation script
 * Validates the MCP server implementation against our standards
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

class ServerValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async validateAll() {
    console.log('🧪 Validating MCP Server Implementation...\n');
    
    await this.validateProjectStructure();
    await this.validateConfiguration();
    await this.validateCodeQuality();
    await this.validateDocumentation();
    
    this.printResults();
  }

  async validateProjectStructure() {
    console.log('🏗️ Validating Project Structure...');
    
    const requiredDirectories = [
      'src',
      'src/config',
      'src/data', 
      'src/business',
      'src/presentation',
      'src/utils',
      'tests',
      'tests/unit',
      'tests/integration',
      'scripts'
    ];
    
    for (const dir of requiredDirectories) {
      await this.checkDirectoryExists(dir);
    }
    
    const requiredFiles = [
      'src/index.js',
      'src/config/index.js',
      'src/data/standards-loader.js',
      'src/business/standards-validator.js',
      'src/presentation/mcp-server.js',
      'src/utils/logger.js',
      'package.json',
      '.env.example',
      '.gitignore'
    ];
    
    for (const file of requiredFiles) {
      await this.checkFileExists(file);
    }
  }

  async validateConfiguration() {
    console.log('⚙️ Validating Configuration...');
    
    // Check package.json
    const packageJson = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf-8'));
    
    if (packageJson.type === 'module') {
      this.pass('Package.json configured for ES modules');
    } else {
      this.fail('Package.json should use ES modules (type: "module")');
    }
    
    if (packageJson.scripts.validate) {
      this.pass('Validation script defined');
    } else {
      this.fail('Missing validation script in package.json');
    }
    
    // Check .env.example
    const envExample = await readFile(join(rootDir, '.env.example'), 'utf-8');
    
    const requiredEnvVars = [
      'GITHUB_TOKEN',
      'GITHUB_OWNER', 
      'GITHUB_REPO',
      'NODE_ENV'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (envExample.includes(envVar)) {
        this.pass(`Environment variable ${envVar} documented`);
      } else {
        this.fail(`Missing environment variable ${envVar} in .env.example`);
      }
    }
  }

  async validateCodeQuality() {
    console.log('💎 Validating Code Quality...');
    
    // Check for ES module imports
    const indexJs = await readFile(join(rootDir, 'src/index.js'), 'utf-8');
    
    if (indexJs.includes('import ') && indexJs.includes('from ')) {
      this.pass('ES module imports used correctly');
    } else {
      this.fail('Should use ES module imports');
    }
    
    if (indexJs.includes('try {') && indexJs.includes('catch (error)')) {
      this.pass('Error handling implemented');
    } else {
      this.fail('Missing proper error handling');
    }
    
    // Check for configuration usage
    const configJs = await readFile(join(rootDir, 'src/config/index.js'), 'utf-8');
    
    if (configJs.includes('process.env') && configJs.includes('dotenv')) {
      this.pass('Configuration management implemented');
    } else {
      this.fail('Missing proper configuration management');
    }
  }

  async validateDocumentation() {
    console.log('📚 Validating Documentation...');
    
    const readme = await readFile(join(rootDir, 'README.md'), 'utf-8');
    
    const requiredSections = [
      '## 🎯 Purpose',
      '## 🏗️ Architecture', 
      '## 🚀 Quick Start',
      '## 🎯 Features'
    ];
    
    for (const section of requiredSections) {
      if (readme.includes(section)) {
        this.pass(`README contains ${section}`);
      } else {
        this.fail(`README missing ${section}`);
      }
    }
  }

  async checkDirectoryExists(dirPath) {
    try {
      const fullPath = join(rootDir, dirPath);
      const files = await readdir(fullPath);
      this.pass(`Directory exists: ${dirPath}`);
    } catch (error) {
      this.fail(`Missing directory: ${dirPath}`);
    }
  }

  async checkFileExists(filePath) {
    try {
      const fullPath = join(rootDir, filePath);
      await readFile(fullPath);
      this.pass(`File exists: ${filePath}`);
    } catch (error) {
      this.fail(`Missing file: ${filePath}`);
    }
  }

  pass(message) {
    console.log(`  ✅ ${message}`);
    this.results.passed++;
  }

  fail(message) {
    console.log(`  ❌ ${message}`);
    this.results.failed++;
    this.results.errors.push(message);
  }

  printResults() {
    console.log('\n📊 Validation Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n🚨 Issues to fix:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
      
      console.log('\n💡 Next steps:');
      console.log('  1. Fix the validation errors above');
      console.log('  2. Run validation again: npm run validate');
      console.log('  3. Commit changes to feature branch');
      
      process.exit(1);
    } else {
      console.log('\n🎉 All validations passed!');
      console.log('\n✅ MCP server implementation follows AI Development Standards');
      console.log('🚀 Ready for testing and deployment');
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ServerValidator();
  validator.validateAll().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export default ServerValidator;
