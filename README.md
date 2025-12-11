# CF-Mail

Just Simple One CF-MAIL

## 特色

- **单用户** - 专为个人设计，无需复杂的多用户管理
- **仅收件** - 不支持发件，简单纯粹
- **验证码提取** - 自动识别邮件中的验证码，一键复制
- **Telegram 转发** - 新邮件实时推送到 TG（开发中）

## 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lyon-le/cf-mail)

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **前端**: Tailwind CSS + Alpine.js

## 鸣谢

- [cloud-mail](https://github.com/maillab/cloud-mail) - Telegram 转发功能
- [freemail](https://github.com/idinging/freemail) - 验证码提取逻辑

## License

MIT
