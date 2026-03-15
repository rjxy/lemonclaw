import * as chrono from 'chrono-node';

/**
 * 自然语言时间解析工具
 * 使用 chrono-node 解析中文时间表达
 */
export class TimeParser {
  // chrono 中文解析器
  private static chronoCN = chrono.casual.clone();

  /**
   * 解析自然语言时间
   * @param text 时间文本，如 "明天早上9点"、"每天下午3点"
   * @param referenceDate 参考日期，默认当前时间
   */
  static parse(text: string, referenceDate?: Date): Date | null {
    const results = this.chronoCN.parse(text, referenceDate);
    if (results.length > 0) {
      return results[0].date();
    }
    return null;
  }

  /**
   * 解析 cron 表达式相关的时间
   * @param text 时间文本
   */
  static parseToCron(text: string): string | null {
    // 常见模式映射
    const patterns: Record<string, string> = {
      每天早上9点: '0 9 * * *',
      每天上午9点: '0 9 * * *',
      每天下午3点: '0 15 * * *',
      每天晚上8点: '0 20 * * *',
      每周一早上9点: '0 9 * * 1',
      每周五下午5点: '0 17 * * 5',
      每小时: '0 * * * *',
      每30分钟: '*/30 * * * *',
    };

    // 精确匹配
    if (patterns[text]) {
      return patterns[text];
    }

    // 尝试解析 "每天X点" 格式
    const dailyMatch = text.match(/每天.*?(\d{1,2})点/);
    if (dailyMatch) {
      let hour = parseInt(dailyMatch[1], 10);
      if (text.includes('下午') || text.includes('晚上')) {
        hour = hour < 12 ? hour + 12 : hour;
      }
      return `0 ${hour} * * *`;
    }

    return null;
  }

  /**
   * 格式化日期为可读字符串
   * @param date 日期对象
   */
  static format(date: Date): string {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
