import { registerAs } from '@nestjs/config';

/**
 * AI 模型配置
 * 支持 DeepSeek、通义千问、GPT、本地模型
 */
export default registerAs('ai', () => ({
  // 当前使用的模型提供商
  provider: process.env.AI_PROVIDER || 'deepseek',

  // DeepSeek 配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  // 通义千问配置
  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    baseUrl:
      process.env.QWEN_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.QWEN_MODEL || 'qwen-turbo',
  },

  // OpenAI/GPT 配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  // 本地模型配置（Ollama）
  local: {
    baseUrl: process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
    model: process.env.LOCAL_MODEL || 'llama3',
  },

  // Embedding 模型配置
  embedding: {
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  },
}));
