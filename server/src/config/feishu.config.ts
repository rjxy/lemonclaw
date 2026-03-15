import { registerAs } from '@nestjs/config';

/**
 * 飞书配置
 */
export default registerAs('feishu', () => ({
  // 飞书应用凭证
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,

  // 机器人 Webhook（用于群消息推送）
  webhookUrl: process.env.FEISHU_WEBHOOK_URL,

  // 文档归档目录
  docFolderId: process.env.FEISHU_DOC_FOLDER_ID,
}));
