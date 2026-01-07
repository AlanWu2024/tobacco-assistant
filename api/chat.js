// Vercel Serverless Function - Coze API代理
export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Coze API配置
    const COZE_CONFIG = {
        baseURL: 'https://api.coze.cn/open_api/v2/chat',
        apiKey: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjMxOThhOThiLTZiNzEtNGNiZC04Mjc2LWIyMzJlZGYyZDY2NyJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjRZNjB4SjY5V050V2ZGWHk1cFBYZ2hRM2R4eUhGeHQ3Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3ODE4NDkxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkwNDAzMzg5Nzc5ODY5NzM3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkyNzIyNjA3NjI4MDkxMzk4In0.azPRpBBRGtrTfDxpf4UvRPFkwsKATdOXOZPvALCg41lzsl9sSw1TDjxXfcOhSs78lERkd30uKCspv_RRBwxbyzLHjqPhrMAc-Kj_rd7ON8SxETHjcUbPePF5DVNi7YeaHYCpum86aCk8KikXrpVD8jQgfCnwIjMylXdGbvYkvPrYN5FW2QLIGYxPk_jT3jgo9Y0Pgav6UZqzI2F0zI9LBSAA8sa0HCt_xDmEGv3NR0U42tm_DRgzDJqI2x2nvVxwicghhXtWSP8mKPAD92LqCxLPJLRW4K6en6IugfVfLGSZyTkZ-ECSiizPMCyUbO9sEjK1dlrVMrDFftWupB2C8w',
        botId: '4Y60xJ69WNtWfFXy5pXghQ3dxyHFxt7'
    };

    try {
        const { query, files = [] } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // 调用Coze API
        const response = await fetch(COZE_CONFIG.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                bot_id: COZE_CONFIG.botId,
                user: 'web_user_' + Date.now(),
                query: query,
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Coze API Error:', errorText);
            return res.status(response.status).json({ 
                error: 'Coze API调用失败',
                details: errorText 
            });
        }

        // 设置响应头为流式传输
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 转发流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: '服务器错误',
            message: error.message 
        });
    }
}
