import { registerAs } from '@nestjs/config';

/**
 * AI 模型配置
 *
 * 本配置文件统一管理所有 AI 模型的连接信息，支持：
 * - DeepSeek：高性价比国产大模型
 * - 通义千问：阿里云大模型服务
 * - OpenAI/GPT：GPT 系列模型
 * - 本地模型：通过 Ollama 运行的本地模型
 *
 * 使用 LangChain 统一封装，可通过 AI_PROVIDER 环境变量快速切换
 */
export default registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER || 'qwen',
  qwen: {
    /** API 密钥，从阿里云 DashScope 获取 */
    apiKey: process.env.QWEN_API_KEY,
    /** API 基础地址（兼容 OpenAI 格式） */
    baseUrl: process.env.QWEN_BASE_URL,
    /** 模型名称：qwen-turbo / qwen-plus / qwen-max */
    model: process.env.QWEN_MODEL || 'qwen-plus',
  },
  deepseek: {
    /** API 密钥，从 DeepSeek 控制台获取 */
    apiKey: process.env.DEEPSEEK_API_KEY,
    /** API 基础地址 */
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    /** 模型名称：deepseek-chat / deepseek-coder */
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
  openai: {
    /** API 密钥，从 OpenAI 控制台获取 */
    apiKey: process.env.OPENAI_API_KEY,
    /** API 基础地址，可配置代理 */
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    /** 模型名称：gpt-4o / gpt-4o-mini / gpt-3.5-turbo */
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  local: {
    /** Ollama 服务地址 */
    baseUrl: process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
    /** 模型名称：llama3 / mistral / codellama 等 */
    model: process.env.LOCAL_MODEL || 'llama3',
  },
  embedding: {
    /** 向量化服务提供商：openai / local */
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    /** 向量化模型：text-embedding-3-small / text-embedding-ada-002 */
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  },
}));
