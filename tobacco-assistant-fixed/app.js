// API配置 - 调用后端API
const API_URL = '/api/chat';

const messages = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');

// 简单的Markdown解析器
function parseMarkdown(text) {
    let html = text;
    
    html = html.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
    
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');
    
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<table>';
                const headers = line.split('|').filter(cell => cell.trim());
                tableHtml += '<thead><tr>';
                headers.forEach(header => {
                    tableHtml += `<th>${header.trim()}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
                if (i + 1 < lines.length && lines[i + 1].includes('---')) {
                    i++;
                }
            } else {
                const cells = line.split('|').filter(cell => cell.trim());
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td>${cell.trim()}</td>`;
                });
                tableHtml += '</tr>';
            }
        } else {
            if (inTable) {
                tableHtml += '</tbody></table>';
                processedLines.push(tableHtml);
                tableHtml = '';
                inTable = false;
            }
            processedLines.push(line);
        }
    }
    
    if (inTable) {
        tableHtml += '</tbody></table>';
        processedLines.push(tableHtml);
    }
    
    html = processedLines.join('\n');
    html = html.replace(/^\- (.*)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
}

input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});

function addMessage(text, isUser) {
    const welcome = messages.querySelector('.welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (isUser) {
        content.textContent = text;
    } else {
        content.innerHTML = parseMarkdown(text);
    }
    
    div.appendChild(content);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    
    return content;
}

function updateBotMessage(element, text) {
    element.innerHTML = parseMarkdown(text);
    messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.id = 'typing';
    div.className = 'typing active';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

function showError(msg) {
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = '❌ ' + msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showWarning(msg) {
    const div = document.createElement('div');
    div.className = 'warning';
    div.textContent = '⚠️ ' + msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

async function send() {
    const query = input.value.trim();
    if (!query) return;

    addMessage(query, true);
    input.value = '';
    input.style.height = 'auto';

    sendBtn.disabled = true;
    input.disabled = true;
    showTyping();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query
            })
        });

        hideTyping();

        if (response.ok) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let botMessage = null;
            let hasError = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('event:') && !line.startsWith('data:')) {
                        continue;
                    }

                    if (line.startsWith('data:')) {
                        try {
                            const jsonStr = line.substring(5).trim();
                            const data = JSON.parse(jsonStr);

                            if (data.type === 'answer') {
                                if (data.content && data.content.answer) {
                                    fullText += data.content.answer;
                                    if (!botMessage) {
                                        botMessage = addMessage('', false);
                                    }
                                    updateBotMessage(botMessage, fullText);
                                }
                            } else if (data.type === 'message_end') {
                                if (data.content && data.content.message_end) {
                                    const endData = data.content.message_end;
                                    if (endData.code && endData.code !== '200') {
                                        hasError = true;
                                        showWarning(`API返回错误: ${endData.message || '未知错误'}`);
                                    }
                                }
                            }
                        } catch (e) {
                            console.log('解析JSON失败:', e);
                        }
                    }
                }
            }

            if (!fullText.trim()) {
                if (!hasError) {
                    showError('未收到有效回复，请检查配置');
                }
                if (botMessage) {
                    botMessage.parentElement.remove();
                }
            }
        } else {
            showError(`请求失败: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        hideTyping();
        showError('请求失败: ' + error.message);
    } finally {
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

function ask(question) {
    input.value = question;
    send();
}
