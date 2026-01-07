export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const formData = await parseMultipartForm(req);
        const message = formData.fields.message || '';
        const file = formData.files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 从环境变量获取配置
        const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:5000';

        // 创建新的FormData发送到本地API
        const FormData = require('form-data');
        const fs = require('fs');
        const uploadFormData = new FormData();
        
        uploadFormData.append('message', message);
        uploadFormData.append('file', fs.createReadStream(file.filepath), {
            filename: file.originalFilename,
            contentType: file.mimetype
        });

        // 调用本地API的upload_and_run接口
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${LOCAL_API_URL}/upload_and_run`, {
            method: 'POST',
            body: uploadFormData,
            headers: uploadFormData.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Local API error! status: ${response.status}`);
        }

        // 设置SSE响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 流式转发响应
        const reader = response.body;
        reader.on('data', (chunk) => {
            res.write(chunk);
        });

        reader.on('end', () => {
            res.end();
        });

        reader.on('error', (error) => {
            console.error('Stream error:', error);
            res.end();
        });

    } catch (error) {
        console.error('Error in upload handler:', error);
        res.status(500).json({ error: error.message });
    }
}

// 简单的multipart/form-data解析
async function parseMultipartForm(req) {
    const formidable = require('formidable');
    const form = formidable({ multiples: false });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export const config = {
    api: {
        bodyParser: false, // 禁用默认body解析，使用formidable
    },
};
