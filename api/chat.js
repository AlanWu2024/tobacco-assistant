// Vercel Serverless Function - 烟草合规AI助手后端API
module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 从环境变量获取API Token
        const COZE_API_TOKEN = process.env.COZE_API_TOKEN;
        
        if (!COZE_API_TOKEN) {
            console.error('COZE_API_TOKEN not found');
            return res.status(500).json({ 
                error: 'API配置错误',
                message: '请在Vercel环境变量中设置COZE_API_TOKEN'
            });
        }

        // 获取用户消息
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: '消息内容不能为空' });
        }

        console.log('Received message:', message);

        // 调用Coze API
        const cozeResponse = await fetch('https://api.coze.cn/v1/workflow/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workflow_id: '7590376721527013430',
                parameters: {
                    BOT_USER_INPUT: message
                }
            })
        });

        if (!cozeResponse.ok) {
            const errorText = await cozeResponse.text();
            console.error('Coze API error:', cozeResponse.status, errorText);
            return res.status(500).json({ 
                error: 'Coze API调用失败',
                details: errorText,
                reply: '抱歉，调用智能体API失败，请检查API Token是否正确。'
            });
        }

        const data = await cozeResponse.json();
        console.log('Coze API response:', JSON.stringify(data).substring(0, 200));

        // 提取回复内容
        let reply = '';
        
        if (data.data) {
            reply = data.data;
        } else if (data.output) {
            reply = data.output;
        } else if (data.result) {
            reply = data.result;
        } else if (data.message) {
            reply = data.message;
        } else {
            reply = JSON.stringify(data);
        }

        // 返回结果
        return res.status(200).json({ 
            reply: reply,
            success: true
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        return res.status(500).json({ 
            error: '服务器错误',
            message: error.message,
            reply: `抱歉，服务器出错了：${error.message}`
        });
    }
};
