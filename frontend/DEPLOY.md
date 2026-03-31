# 前端项目部署指南

## 项目结构

```
frontend/
├── src/              # 源代码
├── public/           # 静态资源
├── dist/             # 构建输出（自动生成）
├── package.json      # 依赖配置
├── vite.config.ts    # Vite 配置
├── tailwind.config.js # Tailwind CSS 配置
├── postcss.config.js # PostCSS 配置
├── .prettierrc       # Prettier 配置
└── eslint.config.js  # ESLint 配置
```

## 可用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 格式化代码
npm run format

# 检查格式化
npm run format:check
```

## CI/CD 配置

项目已配置 GitHub Actions 自动部署到 Cloudflare Pages。

### 需要配置的 Secrets

在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_PROJECT_NAME` | Cloudflare Pages 项目名称 |

### 获取 Cloudflare API Token

1. 登录 Cloudflare Dashboard
2. 进入 My Profile -> API Tokens
3. 点击 "Create Token"
4. 使用 "Custom token" 模板
5. 权限设置：
   - Zone:Read (如果需要自定义域名)
   - Cloudflare Pages:Edit

### 工作流程

- 每次推送到 `main` 分支会自动触发构建和部署
- Pull Request 会运行检查和构建，但不会部署

## 技术栈

- **框架**: React 19
- **构建工具**: Vite 8
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **代码规范**: ESLint 9 + Prettier 3
