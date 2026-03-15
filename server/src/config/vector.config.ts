import { registerAs } from '@nestjs/config';

/**
 * 向量数据库配置
 */
export default registerAs('vector', () => ({
  // 向量数据库类型：chroma | pinecone
  type: process.env.VECTOR_DB_TYPE || 'chroma',

  // Chroma 配置
  chroma: {
    url: process.env.CHROMA_URL || 'http://localhost:8000',
    collection: process.env.CHROMA_COLLECTION || 'lemonclaw',
  },

  // Pinecone 配置
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENV,
    index: process.env.PINECONE_INDEX || 'lemonclaw',
  },
}));
