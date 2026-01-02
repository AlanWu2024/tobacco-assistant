# 烟丝出口东南亚智能助手

专业解答关于烟丝出口东南亚市场的各类问题。

## 部署到Vercel

### 方法1：通过GitHub（推荐）

1. **上传到GitHub**
   - 将所有文件上传到您的GitHub仓库
   - 确保包含：index.html, app.js, api/chat.js, vercel.json, package.json

2. **在Vercel导入**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Add New..." → "Project"
   - 选择您的GitHub仓库
   - **重要：不要修改任何配置**
   - 直接点击 "Deploy"

3. **设置环境变量**
   - 部署后，进入项目设置
   - 找到 "Environment Variables"
   - 添加以下变量：
     - `COZE_API_TOKEN`: 您的Coze API Token
     - `COZE_API_URL`: https://q4y8jrbxy4.coze.site/stream_run
     - `COZE_PROJECT_ID`: 7590376721527013430
   - 保存后，点击 "Redeploy"

### 方法2：直接拖拽

1. 将整个文件夹打包成zip
2. 拖拽到Vercel
3. 设置环境变量（同上）

## 环境变量说明

必须在Vercel中设置以下环境变量：

- `COZE_API_TOKEN`: Coze API授权令牌（必需）
- `COZE_API_URL`: Coze API端点（可选，默认值已设置）
- `COZE_PROJECT_ID`: Coze项目ID（可选，默认值已设置）

## 技术架构

- **前端**: HTML + JavaScript（原生）
- **后端**: Vercel Serverless Functions
- **API**: Coze AI Platform

## 文件结构

```
tobacco-vercel-deploy/
├── index.html          # 前端页面
├── app.js             # 前端逻辑
├── api/
│   └── chat.js        # 后端API（Vercel Serverless Function）
├── vercel.json        # Vercel配置
├── package.json       # 项目配置
└── README.md          # 说明文档
```

## 常见问题

### 部署后出现404错误

**原因**: Vercel配置错误

**解决方案**:
1. 进入项目设置 → General
2. 找到 "Build & Development Settings"
3. 确保：
   - Build Command: 留空
   - Output Directory: `.` 或留空
   - Install Command: 留空
4. 保存并重新部署

### 点击发送没反应

**原因**: 环境变量未设置

**解决方案**:
1. 检查是否设置了 `COZE_API_TOKEN`
2. 打开浏览器控制台（F12）查看错误信息
3. 如果看到 "API Token not configured"，说明需要设置环境变量
4. 设置后必须重新部署（Redeploy）

### CORS错误

**原因**: 直接调用Coze API

**解决方案**:
- 本项目已通过Vercel Serverless Function解决CORS问题
- 确保前端调用的是 `/api/chat` 而不是直接调用Coze API

## 支持

如有问题，请检查：
1. 环境变量是否正确设置
2. 浏览器控制台是否有错误信息
3. Vercel部署日志是否有错误
