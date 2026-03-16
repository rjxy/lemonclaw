/**
 * RSS 源配置类型定义
 */

// RSS 源分类
export type RssCategory = 'frontend' | 'tech' | 'tech-cn' | 'ai';

// RSS 源语言
export type RssLanguage = 'zh' | 'en';

// 单个 RSS 源配置
export interface RssSource {
  id: string; // 唯一标识
  name: string; // 显示名称
  url: string; // RSS 地址
  category: RssCategory; // 分类
  language: RssLanguage; // 语言
  interval: number; // 抓取间隔（分钟）
  enabled: boolean; // 是否启用
  description: string; // 描述
}

// 分类配置
export interface RssCategoryConfig {
  id: RssCategory;
  name: string;
  color: string;
}

// RSS 源配置文件结构
export interface RssSourcesConfig {
  sources: RssSource[];
  categories: RssCategoryConfig[];
}

// 导入 JSON 配置
import rssSourcesJson from './rss-sources.json';

// 导出配置（带类型）
export const rssSourcesConfig: RssSourcesConfig =
  rssSourcesJson as RssSourcesConfig;

// 便捷方法：获取所有启用的源
export const getEnabledSources = (): RssSource[] => {
  return rssSourcesConfig.sources.filter((source) => source.enabled);
};

// 便捷方法：按分类获取源
export const getSourcesByCategory = (category: RssCategory): RssSource[] => {
  return rssSourcesConfig.sources.filter(
    (source) => source.category === category && source.enabled,
  );
};

// 便捷方法：根据 ID 获取源
export const getSourceById = (id: string): RssSource | undefined => {
  return rssSourcesConfig.sources.find((source) => source.id === id);
};
