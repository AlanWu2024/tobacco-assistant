// Vercel Serverless Function - 富铖智能助手API代理
// 简化版：不使用 form-data 依赖，直接在消息中处理文件内容

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

        console.log('=== 收到请求 ===');
        console.log('Query:', query);
        console.log('Files count:', files.length);
        console.log('Files details:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));

        // Coze API配置
        const COZE_API_TOKEN = process.env.COZE_API_TOKEN || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjMxOThhOThiLTZiNzEtNGNiZC04Mjc2LWIyMzJlZGYyZDY2NyJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjRZNjB4SjY5V050V2ZGWHk1cFBYZ2hRM2R4eUhGeHQ3Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3ODE4NDkxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkwNDAzMzg5Nzc5ODY5NzM3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkyNzIyNjA3NjI4MDkxMzk4In0.azPRpBBRGtrTfDxpf4UvRPFkwsKATdOXOZPvALCg41lzsl9sSw1TDjxXfcOhSs78lERkd30uKCspv_RRBwxbyzLHjqPhrMAc-Kj_rd7ON8SxETHjcUbPePF5DVNi7YeaHYCpum86aCk8KikXrpVD8jQgfCnwIjMylXdGbvYkvPrYN5FW2QLIGYxPk_jT3jgo9Y0Pgav6UZqzI2F0zI9LBSAA8sa0HCt_xDmEGv3NR0U42tm_DRgzDJqI2x2nvVxwicghhXtWSP8mKPAD92LqCxLPJLRW4K6en6IugfVfLGSZyTkZ-ECSiizPMCyUbO9sEjK1dlrVMrDFftWupB2C8w';
        const COZE_API_URL = process.env.COZE_API_URL || 'https://q4y8jrbxy4.coze.site/stream_run';
        const COZE_PROJECT_ID = process.env.COZE_PROJECT_ID || '7590376721527013430';

        // 构建请求体
        const prompt = [];
        
        // 添加文本内容
        let fullQuery = query || '';
        
        // 处理文件
        for (const file of files) {
            console.log('处理文件:', file.name, 'type:', file.type);
            
            if (file.type && file.type.startsWith('image/')) {
                // 图片文件：直接使用base64 data URL
                if (file.data) {
                    prompt.push({
                        type: "image",
                        content: {
                            image_url: file.data
                        }
                    });
                    console.log('已添加图片:', file.name);
                }
            } else if (file.textContent) {
                // 纯文本文件：将内容添加到查询文本中
                fullQuery += `\n\n===== 文件内容：${file.name} =====\n${file.textContent}\n===== 文件结束 =====`;
                console.log('已添加文本文件内容:', file.name, '长度:', file.textContent.length);
            } else if (file.data) {
                // 其他文件（PDF, Word等）：暂时无法处理，添加提示
                // 注意：对于这类文件，需要先上传到对象存储获取 URL，或者使用专门的文件处理服务
                fullQuery += `\n\n【注意：已上传文件 ${file.name}，但当前版本暂不支持直接读取 ${file.type} 格式的文件内容。建议将文件转换为文本格式或使用图片格式。】`;
                console.log('已添加文件提示（不支持该格式）:', file.name);
            }
        }
        
        // 添加查询文本（包含文件内容）
        if (fullQuery) {
            prompt.push({
                type: "text",
                content: {
                    text: fullQuery
                }
            });
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

        console.log('=== Coze API 请求 ===');
        console.log('API URL:', COZE_API_URL);
        console.log('Prompt items:', prompt.length);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        // 调用Coze API
        console.log('开始调用 Coze API...');
        const response = await fetch(COZE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Coze API 响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Coze API 错误:', response.status, errorText);
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

        console.log('开始流式传输响应...');

        // 流式传输响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('流式传输完成，共收到', chunkCount, '个数据块');
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            chunkCount++;
            
            // 直接透传所有数据
            res.write(chunk);
        }

        res.end();
        console.log('=== 请求处理完成 ===');

    } catch (error) {
        console.error('服务器错误:', error);
        console.error('错误堆栈:', error.stack);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message,
                stack: error.stack
            });
        }
    }
}
