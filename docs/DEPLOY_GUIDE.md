# Cloudflare Pages 部署配置指南

**项目:** chenfan-ai-detector  
**创建日期:** 2026-03-31

---

## 配置步骤概览

```
1. 创建 Cloudflare API Token
2. 获取 Cloudflare Account ID
3. 创建 Cloudflare Pages 项目
4. 配置 GitHub Secrets
5. 验证部署
```

---

## 步骤 1: 创建 Cloudflare API Token

### 1.1 登录 Cloudflare 控制台
- 访问: https://dash.cloudflare.com
- 使用你的 Cloudflare 账号登录

### 1.2 进入 API Tokens 页面
- 点击右上角头像 → **My Profile**
- 左侧菜单 → **API Tokens**
- 点击 **Create Token**

### 1.3 使用模板创建 Token
- 找到 **"Cloudflare Pages"** 模板，点击 **Use template**
- 或者选择 **Create Custom Token**

### 1.4 配置 Token 权限（自定义方式）

| 设置项 | 值 |
|--------|-----|
| **Token name** | `GitHub Actions - chenfan-ai-detector` |
| **Permissions** | |
| - Zone:Read | 可选 |
| - Account:Read | 必须 |
| - Cloudflare Pages:Edit | 必须 |
| **Account Resources** | Include: 你的账号 |
| **Zone Resources** | Include: All zones (或指定域名) |

### 1.5 生成 Token
- 点击 **Continue to summary**
- 确认权限配置
- 点击 **Create Token**

⚠️ **重要:** 复制生成的 Token 并保存好，**只显示一次！**

格式类似: `g8jH9kL2mN3pQ4rS5tU6vW7xY8zA9bC0dE1fG2h`

---

## 步骤 2: 获取 Cloudflare Account ID

### 方法 1: 从控制台获取
1. 登录 https://dash.cloudflare.com
2. 右侧边栏查看 **Account ID**
3. 格式类似: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

### 方法 2: 使用 Wrangler CLI
```bash
npx wrangler whoami
```
输出中会显示 Account ID

---

## 步骤 3: 创建 Cloudflare Pages 项目

### 方法 1: 通过控制台创建
1. 登录 https://dash.cloudflare.com
2. 左侧菜单 → **Pages**
3. 点击 **Create a project**
4. 选择 **Upload assets**
5. 项目名称填写: `chenfan-ai-detector`
6. 点击 **Create project**

### 方法 2: 使用 Wrangler CLI
```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
npx wrangler login

# 创建项目
npx wrangler pages project create chenfan-ai-detector
```

---

## 步骤 4: 配置 GitHub Secrets

### 4.1 进入 GitHub 仓库设置
1. 访问: https://github.com/gccc40684/chenfan-ai-detector
2. 点击 **Settings** 标签
3. 左侧菜单 → **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

### 4.2 添加 3 个 Secrets

#### Secret 1: CLOUDFLARE_API_TOKEN
- **Name:** `CLOUDFLARE_API_TOKEN`
- **Secret:** 步骤1生成的 Token
- 点击 **Add secret**

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
- **Name:** `CLOUDFLARE_ACCOUNT_ID`
- **Secret:** 步骤2获取的 Account ID
- 点击 **Add secret**

#### Secret 3: CLOUDFLARE_PROJECT_NAME
- **Name:** `CLOUDFLARE_PROJECT_NAME`
- **Secret:** `chenfan-ai-detector`
- 点击 **Add secret**

### 4.3 验证 Secrets 配置
配置完成后，Secrets 列表应显示：
- ✅ CLOUDFLARE_API_TOKEN
- ✅ CLOUDFLARE_ACCOUNT_ID
- ✅ CLOUDFLARE_PROJECT_NAME

---

## 步骤 5: 验证部署

### 5.1 触发首次部署
1. 确保代码已推送到 `main` 分支
2. 在 GitHub 仓库 → **Actions** 标签查看工作流
3. 应看到 **"Deploy to Cloudflare Pages"** 工作流正在运行

### 5.2 查看部署状态
- 绿色 ✅: 部署成功
- 红色 ❌: 部署失败，点击查看日志

### 5.3 访问部署后的网站
- 部署成功后，Cloudflare Pages 会提供域名
- 格式: `https://chenfan-ai-detector.pages.dev`

---

## 故障排查

### 问题 1: "Unauthorized" 错误
**原因:** API Token 权限不足  
**解决:** 重新创建 Token，确保包含 `Cloudflare Pages:Edit` 权限

### 问题 2: "Project not found" 错误
**原因:** Pages 项目不存在  
**解决:** 先在 Cloudflare 控制台创建项目，或检查 PROJECT_NAME 是否正确

### 问题 3: 构建失败
**原因:** 代码有 lint/format 错误  
**解决:** 本地运行 `npm run lint` 和 `npm run format` 修复

### 问题 4: 部署成功但页面空白
**原因:** 构建输出目录配置错误  
**解决:** 检查 `deploy.yml` 中的 `directory: frontend/dist` 是否正确

---

## 配置检查清单

- [ ] 已创建 Cloudflare API Token
- [ ] 已获取 Cloudflare Account ID
- [ ] 已创建 Cloudflare Pages 项目
- [ ] 已在 GitHub 添加 CLOUDFLARE_API_TOKEN
- [ ] 已在 GitHub 添加 CLOUDFLARE_ACCOUNT_ID
- [ ] 已在 GitHub 添加 CLOUDFLARE_PROJECT_NAME
- [ ] 已推送到 main 分支触发部署
- [ ] 部署成功，网站可访问

---

## 参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)

---

**完成配置后，每次 push 到 main 分支都会自动部署到 Cloudflare Pages！**
