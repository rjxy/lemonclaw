import { registerAs } from '@nestjs/config';

/**
 * ============================================================================
 * registerAs 详解
 * ============================================================================
 *
 * registerAs 是 @nestjs/config 模块提供的工厂函数，用于创建命名空间配置。
 *
 * 函数签名：
 *   registerAs<T>(token: string, configFactory: () => T): ConfigFactory<T>
 *
 * 参数说明：
 *   - token: 配置的命名空间标识符（如 'ai'、'database'、'feishu'）
 *   - configFactory: 返回配置对象的工厂函数
 *
 * 核心优势：
 *   1. 命名空间隔离 - 避免配置项冲突，如 ai.apiKey vs database.apiKey
 *   2. 类型安全 - 支持 TypeScript 类型推断
 *   3. 延迟加载 - 配置在首次访问时才会执行工厂函数
 *   4. 依赖注入 - 可通过 @Inject(ConfigType) 注入到服务中
 *
 * ============================================================================
 * 使用示例
 * ============================================================================
 *
 * 示例1：在模块中注册配置
 * ```typescript
 * // app.module.ts
 * import aiConfig from './config/ai.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       load: [aiConfig],  // 加载配置
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * 示例2：在服务中注入并使用配置
 * ```typescript
 * // ai.service.ts
 * import { Inject, Injectable } from '@nestjs/common';
 * import { ConfigType } from '@nestjs/config';
 * import aiConfig from './config/ai.config';
 *
 * @Injectable()
 * export class AiService {
 *   constructor(
 *     // 方式1：使用 ConfigType 获取完整类型推断（推荐）
 *     @Inject(aiConfig.KEY)
 *     private readonly aiConf: ConfigType<typeof aiConfig>,
 *   ) {}
 *
 *   getApiKey(): string {
 *     // 完整的类型提示：this.aiConf.deepseek.apiKey
 *     return this.aiConf.deepseek.apiKey;
 *   }
 * }
 * ```
 *
 * 示例3：通过 ConfigService 访问（传统方式）
 * ```typescript
 * // another.service.ts
 * import { Injectable } from '@nestjs/common';
 * import { ConfigService } from '@nestjs/config';
 *
 * @Injectable()
 * export class AnotherService {
 *   constructor(private configService: ConfigService) {}
 *
 *   getModel(): string {
 *     // 通过命名空间访问：'ai.deepseek.model'
 *     return this.configService.get<string>('ai.deepseek.model');
 *   }
 * }
 * ```
 *
 * ============================================================================
 */

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
  /**
   * 当前激活的模型提供商
   * 可选值：'deepseek' | 'qwen' | 'openai' | 'local'
   * 默认：'deepseek'
   */
  provider: process.env.AI_PROVIDER || 'deepseek',

  /**
   * DeepSeek 配置
   * 官网：https://platform.deepseek.com/
   * 特点：高性价比，支持长上下文
   */
  deepseek: {
    /** API 密钥，从 DeepSeek 控制台获取 */
    apiKey: process.env.DEEPSEEK_API_KEY,
    /** API 基础地址 */
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    /** 模型名称：deepseek-chat / deepseek-coder */
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  /**
   * 通义千问配置
   * 官网：https://dashscope.aliyun.com/
   * 特点：阿里云生态，支持多模态
   */
  qwen: {
    /** API 密钥，从阿里云 DashScope 获取 */
    apiKey: process.env.QWEN_API_KEY,
    /** API 基础地址（兼容 OpenAI 格式） */
    baseUrl: process.env.QWEN_BASE_URL,
    /** 模型名称：qwen-turbo / qwen-plus / qwen-max */
    model: process.env.QWEN_MODEL,
  },

  /**
   * OpenAI/GPT 配置
   * 官网：https://platform.openai.com/
   * 特点：能力强大，生态丰富
   */
  openai: {
    /** API 密钥，从 OpenAI 控制台获取 */
    apiKey: process.env.OPENAI_API_KEY,
    /** API 基础地址，可配置代理 */
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    /** 模型名称：gpt-4o / gpt-4o-mini / gpt-3.5-turbo */
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  /**
   * 本地模型配置（Ollama）
   * 官网：https://ollama.ai/
   * 特点：完全本地运行，无需 API Key，隐私安全
   */
  local: {
    /** Ollama 服务地址 */
    baseUrl: process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
    /** 模型名称：llama3 / mistral / codellama 等 */
    model: process.env.LOCAL_MODEL || 'llama3',
  },

  /**
   * Embedding 向量化模型配置
   * 用于 RAG 知识库的文档向量化
   */
  embedding: {
    /** 向量化服务提供商：openai / local */
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    /** 向量化模型：text-embedding-3-small / text-embedding-ada-002 */
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  },
}));
