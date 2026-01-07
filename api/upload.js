import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 解析上传的文件
        const form = formidable({});
        const [fields, files] = await form.parse(req);

        const message = fields.message?.[0] || '';
        const file = files.file?.[0];

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 从环境变量获取Coze配置
        const COZE_API_TOKEN = process.env.COZE_API_TOKEN;
        const COZE_BOT_ID = process.env.COZE_BOT_ID;

        if (!COZE_API_TOKEN || !COZE_BOT_ID) {
            throw new Error('Missing Coze configuration');
        }

        // 步骤1: 上传文件到Coze
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.filepath), {
            filename: file.originalFilename,
            contentType: file.mimetype
        });

        const uploadResponse = await fetch('https://api.coze.cn/v1/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Coze upload error:', errorText);
            throw new Error(`Failed to upload file to Coze: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.code !== 0) {
            throw new Error(`Coze upload failed: ${uploadResult.msg}`);
        }

        const fileId = uploadResult.data.id;
        console.log('File uploaded to Coze, file_id:', fileId);

        // 步骤2: 使用file_id发起对话
        const chatResponse = await fetch('https://api.coze.cn/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: COZE_BOT_ID,
                user_id: `user_${Date.now()}`,
                stream: true,
                auto_save_history: true,
                additional_messages: [
                    {
                        role: 'user',
                        content: message,
                        content_type: 'object_string',
                        object_string: {
                            type: 'file',
                            file_id: fileId,
                            file_url: ''
                        }
                    }
                ]
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('Coze chat error:', errorText);
            throw new Error(`Failed to chat with Coze: ${chatResponse.status}`);
        }

        // 步骤3: 流式转发响应
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of chatResponse.body) {
            res.write(chunk);
        }

        res.end();

        // 清理临时文件
        try {
            fs.unlinkSync(file.filepath);
        } catch (err) {
            console.error('Failed to delete temp file:', err);
        }

    } catch (error) {
        console.error('Error in upload handler:', error);
        res.status(500).json({ 
            error: '服务暂时无法使用，请稍后再试。',
            details: error.message 
        });
    }
}
