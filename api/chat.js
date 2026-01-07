// Vercel Serverless Function
export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // 从环境变量获取配置
        const COZE_API_TOKEN = process.env.COZE_API_TOKEN;
        const COZE_API_URL = process.env.COZE_API_URL || 'https://q4y8jrbxy4.coze.site/stream_run';
        const COZE_PROJECT_ID = process.env.COZE_PROJECT_ID || '7590376721527013430';

        if (!COZE_API_TOKEN) {
            return res.status(500).json({ error: 'API Token not configured' });
        }

        // 构建请求体
        const requestBody = {
            content: {
                query: {
                    prompt: [{
                        type: "text",
                        content: {
                            text: query
                        }
                    }]
                }
            },
            type: "query",
            project_id: parseInt(COZE_PROJECT_ID)
        };

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
            console.error('Coze API error:', errorText);
            return res.status(response.status).json({ 
                error: 'Coze API request failed',
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
        console.error('Error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message 
            });
        }
    }
}
