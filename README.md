# CF-Mail

Just Simple One CF-Mail.

## 特性

- **单用户设计** - 专为个人使用，无需复杂的多用户管理
- **仅收件** - 不支持发件，简单纯粹
- **验证码提取** - 自动识别邮件中的验证码，一键复制
- **Telegram 推送** - 新邮件实时推送到 TG，验证码直接显示

## 展示

<!-- TODO: 添加截图 -->
| 收件箱 | 邮件详情 | TG 推送 |
|--------|----------|---------|
| ![收件箱](docs/images/inbox.png) | ![邮件详情](docs/images/detail.png) | ![TG推送](docs/images/telegram.png) |

## 部署

### 方式一：一键部署

点击按钮自动创建仓库并部署到 Cloudflare Workers：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lyon-le/cf-mail)

### 不要修改任何值，直接进行部署即可。

### 方式二：Fork 部署

适合想要同步上游更新的用户。

**1. Fork 本仓库**

点击右上角 Fork 按钮，将仓库复制到你的 GitHub 账号下。

![alt text](asset/image.png)

**2. 创建 Cloudflare Workers 项目**

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create** → **Pages** → **Connect to Git**
4. 选择你 Fork 的 `cf-mail` 仓库

![alt text](<asset/image copy.png>)
![alt text](<asset/image copy 2.png>)

**3. 配置构建设置**

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`

<!-- TODO: 添加构建配置截图 -->
<!-- ![构建配置](docs/images/cf-build.png) -->

**4. 配置环境变量**

在 **Settings** → **Variables and Secrets** 中添加：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `ADMIN_PASSWORD` | 登录密码 | ✅ |
| `JWT_SECRET` | JWT 签名密钥（随机字符串） | ✅ |
| `MAIL_DOMAIN` | 邮箱域名（如 `example.com`） | ✅ |
| `TG_BOT_TOKEN` | Telegram Bot Token | ❌ |
| `TG_CHAT_ID` | Telegram Chat ID | ❌ |

<!-- TODO: 添加环境变量配置截图 -->
<!-- ![环境变量](docs/images/cf-env.png) -->

**5. 绑定 D1 数据库和 R2 存储**

1. 创建 D1 数据库：**Workers & Pages** → **D1** → **Create**
2. 创建 R2 存储桶：**R2** → **Create bucket**
3. 在项目的 **Settings** → **Bindings** 中绑定：
   - D1 Database: 变量名 `DB`
   - R2 Bucket: 变量名 `R2`

<!-- TODO: 添加绑定截图 -->
<!-- ![绑定](docs/images/cf-bindingpng) -->

**6. 部署**

保存配置后，点击 **Deployments** → **Retry deployment** 重新部署。

## 部署后配置

### 配置 Email Routing

1. 进入 Cloudflare Dashboard → 你的域名 → **Email** → **Email Routing**
2. 启用 Email Routing
3. 添加路由规则：
   - **Catch-all** → **Send to Worker** → 选择 `cf-mail`

<!-- TODO: 添加 Email Routing 配置截图 -->
<!-- ![Email Routing](docs/images/email-routing.png) -->

> 数据库表会在首次访问时自动创建，无需手动初始化。

### 配置 Telegram 推送（可选）

**1. 创建 Bot**

1. 打开 Telegram，搜索 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot`，按提示设置名称
3. 获取 `Bot Token`

<!-- TODO: 添加 BotFather 截图 -->
<!-- ![BotFather](docs/images/tg-botfather.png) -->

**2. 获取 Chat ID**

1. 与你的 Bot 对话，发送任意消息
2. 访问 `https://api.telegram.org/bot<你的TOKEN>/getUpdates`
3. 在返回的 JSON 中找到 `chat.id`

**3. 配置环境变量**

在 Cloudflare Dashboard 添加：
- `TG_BOT_TOKEN`: 你的 Bot Token
- `TG_CHAT_ID`: 你的 Chat ID

配置后，新邮件会自动推送到 Telegram：

<!-- TODO: 添加 TG 推送效果截图 -->
<!-- ![TG 推送效果](docs/images/tg-notification.png) -->

## 鸣谢

- [cloud-mail](https://github.com/maillab/cloud-mail) - Telegram 转发参考
- [freemail](https://github.com/idinging/freemail) - 验证码提取逻辑参考, 一键部署逻辑参考

## License

MIT
