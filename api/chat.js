// Vercel Serverless Function - 富铖智能助手API代理
export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, files = [] } = req.body;

        if (!query && files.length === 0) {
            return res.status(400).json({ error: 'Query or files are required' });
        }

        // Coze API配置
        const COZE_API_TOKEN = process.env.COZE_API_TOKEN || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjMxOThhOThiLTZiNzEtNGNiZC04Mjc2LWIyMzJlZGYyZDY2NyJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjRZNjB4SjY5V050V2ZGWHk1cFBYZ2hRM2R4eUhGeHQ3Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3ODE4NDkxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkwNDAzMzg5Nzc5ODY5NzM3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkyNzIyNjA3NjI4MDkxMzk4In0.azPRpBBRGtrTfDxpf4UvRPFkwsKATdOXOZPvALCg41lzsl9sSw1TDjxXfcOhSs78lERkd30uKCspv_RRBwxbyzLHjqPhrMAc-Kj_rd7ON8SxETHjcUbPePF5DVNi7YeaHYCpum86aCk8KikXrpVD8jQgfCnwIjMylXdGbvYkvPrYN5FW2QLIGYxPk_jT3jgo9Y0Pgav6UZqzI2F0zI9LBSAA8sa0HCt_xDmEGv3NR0U42tm_DRgzDJqI2x2nvVxwicghhXtWSP8mKPAD92LqCxLPJLRW4K6en6IugfVfLGSZyTkZ-ECSiizPMCyUbO9sEjK1dlrVMrDFftWupB2C8w';
        const COZE_API_URL = process.env.COZE_API_URL || 'https://q4y8jrbxy4.coze.site/stream_run';
        const COZE_PROJECT_ID = process.env.COZE_PROJECT_ID || '7590376721527013430';
        const COZE_UPLOAD_URL = 'https://api.coze.cn/v1/files/upload';

        if (!COZE_API_TOKEN) {
            return res.status(500).json({ error: 'API Token not configured' });
        }

        // 辅助函数：上传文件到 Coze
        async function uploadFileToCoze(base64Data, fileName, mimeType) {
            try {
                // 从 base64 data URL 中提取纯 base64 数据
                const base64Content = base64Data.split(',')[1];
                
                // 转换为 Buffer
                const buffer = Buffer.from(base64Content, 'base64');
                
                // 创建 FormData
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', buffer, {
                    filename: fileName,
                    contentType: mimeType
                });
                formData.append('purpose', 'assistants_output');
                
                // 上传到 Coze
                const response = await fetch(COZE_UPLOAD_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${COZE_API_TOKEN}`,
                        ...formData.getHeaders()
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('File upload failed:', response.status, errorText);
                    return null;
                }
                
                const result = await response.json();
                return result.data?.url || result.url;
            } catch (error) {
                console.error('Error uploading file to Coze:', error);
                return null;
            }
        }

        // 构建请求体
        const prompt = [];
        
        // 添加文本内容
        if (query) {
            prompt.push({
                type: "text",
                content: {
                    text: query
                }
            });
        }
        
        // 处理文件
        for (const file of files) {
            console.log('Processing file:', file.name, 'type:', file.type);
            
            if (file.type && file.type.startsWith('image/')) {
                // 图片文件：直接使用base64 data URL
                if (file.data) {
                    prompt.push({
                        type: "image",
                        content: {
                            image_url: file.data
                        }
                    });
                    console.log('Added image:', file.name);
                }
            } else if (file.textContent) {
                // 纯文本文件：直接添加内容
                prompt.push({
                    type: "text",
                    content: {
                        text: file.textContent
                    }
                });
                console.log('Added text file content:', file.name);
            } else if (file.data) {
                // 其他文件（PDF, Word等）：上传到 Coze 获取 URL
                const fileUrl = await uploadFileToCoze(file.data, file.name, file.type);
                
                if (fileUrl) {
                    prompt.push({
                        type: "file",
                        content: {
                            file_url: fileUrl,
                            file_name: file.name
                        }
                    });
                    console.log('Added file from URL:', file.name, 'URL:', fileUrl);
                } else {
                    // 上传失败，添加占位符
                    prompt.push({
                        type: "text",
                        content: {
                            text: `\n【文件上传失败：${file.name}】\n`
                        }
                    });
                    console.log('Failed to upload file:', file.name);
                }
            }
        }
        
        const requestBody = {
            content: {
                query: {
                    prompt: prompt
                }
            },
            type: "query",
            project_id: parseInt(COZE_PROJECT_ID)
        };

        console.log('=== Coze API Request ===');
        console.log('API URL:', COZE_API_URL);
        console.log('Query:', query);
        console.log('Files count:', files.length);
        console.log('Prompt items:', prompt.length);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        // 调用Coze API
        const response = await fetch(COZE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Coze API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: 'Coze API request failed',
                status: response.status,
                details: errorText
            });
        }

        // 设置响应头以支持流式传输
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 流式传输响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error('Server error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message,
                stack: error.stack
            });
        }
    }
}
