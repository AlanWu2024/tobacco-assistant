# 烟丝束出口东南亚智能助手 - 修复版

一个完整的智能助手网页应用，通过后端API安全调用Coze服务。

## 🎯 项目结构

```
tobacco-assistant-fixed/
├── index.html          # 前端页面
├── app.js             # 前端JavaScript
├── api/
│   └── chat.js        # 后端API（Serverless Function）
├── vercel.json        # Vercel配置
├── package.json       # 项目配置
└── README.md          # 本文件
```

## 🚀 部署步骤

### 步骤1：上传到GitHub

#### 方法A：删除旧仓库，创建新仓库（推荐）

1. **删除旧仓库**
   - 访问 `https://github.com/AlanWu2024/tobacco-assistant`
   - 点击 Settings → 滚动到最下面
   - 点击 "Delete this repository"
   - 输入仓库名称确认删除

2. **创建新仓库**
   - 点击右上角 "+" → "New repository"
   - Repository name: `tobacco-assistant`
   - 选择 "Public" 或 "Private"
   - 点击 "Create repository"

3. **上传文件**
   - 在新仓库页面点击 "uploading an existing file"
   - 拖拽以下文件到页面：
     - `index.html`
     - `app.js`
     - `package.json`
     - `vercel.json`
     - `.gitignore`
     - `README.md`
   - 创建 `api` 文件夹，上传 `api/chat.js`
   - 点击 "Commit changes"

#### 方法B：更新现有仓库

1. **删除所有旧文件**
   - 在GitHub仓库中一个一个删除旧文件

2. **上传新文件**
   - 按照上面的方法上传新文件

### 步骤2：在Vercel中配置

1. **删除旧项目（如果有）**
   - 在Vercel中找到旧的 `tobacco-assistant` 项目
   - Settings → 滚动到最下面 → Delete Project

2. **导入新项目**
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 选择您的 `tobacco-assistant` 仓库
   - 点击 "Import"

3. **配置环境变量** ⭐ 重要！
   
   在项目配置页面，点击 "Environment Variables"，添加以下3个变量：

   | Name | Value |
   |------|-------|
   | `COZE_API_TOKEN` | `eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NTc3MGI0LTM2YmYtNGE4OC1hZGQ1LTIwNjcxZDExNWRjZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjRZNjB4SjY5V050V2ZGWHk1cFBYZ2hRM2R4eUhGeHQ3Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3MzAzODA0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkwNDAzMzg5Nzc5ODY5NzM3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkwNTEyMDQwNTQ0ODI5NTAzIn0.eh11NSLes4lt551eTMUc8yxxi6Tfa06j0JKJF4ggDH8n8DjBS8ele2eWodfmirUZHqiTCrjvLdl23pRSof9Q5Wo9iHVImLZEGhe0u7POrYuNsevv20UXROOByW-4GVhlOWJYTGSsXzqGG48OjUNtJ4zMPqxKqS8Ww-oXDfQYfynkxwNZNdzQIY5HvHN6iXrVNELRmQTI0E6Wbb0ZYuu-OvTKh3VCuvbiaZCNVk88713ngJjPLGshD9886J82K48tIwJZNh-DKqXDyto0t8uoWUy9KAO5Z2PPfXDUhliZdgYAiJEJJNErDoB1Gktoxzn_v6RaMr2bg_NcXRpzA2F4cg` |
   | `COZE_API_URL` | `https://q4y8jrbxy4.coze.site/stream_run` |
   | `COZE_PROJECT_ID` | `7590376721527013430` |

   **注意：**
   - 每个变量都要单独添加
   - Name 和 Value 都要准确填写
   - 不要有多余的空格

4. **部署**
   - 点击 "Deploy"
   - 等待1-2分钟

5. **获取网址**
   - 部署完成后，会显示您的网址
   - 例如：`https://tobacco-assistant-xxx.vercel.app`

### 步骤3：测试

1. **打开网址**
   - 点击Vercel提供的网址

2. **测试聊天**
   - 输入问题："出口需要哪些认证？"
   - 查看是否有正常回复

3. **如果出现错误**
   - 检查环境变量是否正确配置
   - 查看Vercel的部署日志
   - 确认Token是否有效

## ✨ 功能特性

- ✅ 美观的聊天界面
- ✅ 支持Markdown格式渲染
- ✅ 表格、列表、代码高亮
- ✅ 响应式设计，支持手机和电脑
- ✅ 流式响应，实时显示回复
- ✅ API Token安全存储在后端
- ✅ 完全免费部署

## 🔧 为什么这个版本能用

### 修复的问题：

1. **简化了vercel.json配置**
   - 只保留最基本的配置
   - Vercel会自动识别文件结构

2. **正确的文件结构**
   - `index.html` 和 `app.js` 在根目录
   - `api/chat.js` 在 api 文件夹
   - Vercel会自动处理路由

3. **正确的API响应头**
   - 使用 `text/event-stream` 支持流式传输
   - 正确处理响应流

## 🔐 安全说明

- ✅ Token存储在Vercel的环境变量中
- ✅ 前端代码中看不到Token
- ✅ 可以安全分享给任何人

## 📱 使用方式

部署完成后：
- 电脑：直接在浏览器打开网址
- 手机：在手机浏览器打开网址
- 分享：把网址发给需要的人

## ⚠️ 常见问题

### Q: 部署后显示404
A: 检查文件是否都上传到GitHub，特别是 `index.html`

### Q: 点击发送没反应
A: 检查环境变量是否正确配置，特别是 `COZE_API_TOKEN`

### Q: 显示"API Token not configured"
A: 环境变量没有配置，回到Vercel项目设置添加环境变量

### Q: 如何更新Token
A: 在Vercel项目设置中，找到Environment Variables，更新 `COZE_API_TOKEN` 的值，然后重新部署

## 📞 技术支持

如有问题，请检查：
- Vercel部署日志
- 浏览器控制台错误（按F12）
- 环境变量是否正确配置

## 📄 许可证

MIT License
