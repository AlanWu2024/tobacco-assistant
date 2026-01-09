/**
 * 实时工具集
 * 提供时间、天气、汇率、搜索等实时查询功能
 */
window.RealTimeTools = (function() {
    /**
     * 判断消息类型
     * @param {string} message 用户消息
     * @returns {string} 'time', 'weather', 'exchange', 'search', 'none'
     */
    function detectQueryType(message) {
        const lowerMessage = message.toLowerCase();

        // 时间查询
        if (window.TimeHelper && window.TimeHelper.isTimeQuery(message)) {
            return 'time';
        }

        // 天气查询
        if (/天气|weather|气温|温度|下雨|晴天|阴天|多云|下雪|台风/i.test(message)) {
            return 'weather';
        }

        // 汇率查询
        if (/汇率|exchange|人民币|美元|欧元|日元|港币|换汇|rate/i.test(message)) {
            return 'exchange';
        }

        // 搜索查询（简单判断）
        if (/搜索|search|查询|了解|关于|什么是/i.test(message)) {
            return 'search';
        }

        return 'none';
    }

    /**
     * 处理实时查询
     * @param {string} message 用户消息
     * @param {function} onChunk 流式输出回调
     * @returns {Promise<boolean>} 是否处理了查询
     */
    async function handleRealTimeQuery(message, onChunk) {
        const queryType = detectQueryType(message);

        switch (queryType) {
            case 'time':
                await handleTimeQuery(message, onChunk);
                return true;
            case 'weather':
                await handleWeatherQuery(message, onChunk);
                return true;
            case 'exchange':
                await handleExchangeQuery(message, onChunk);
                return true;
            case 'search':
                // 搜索查询也发送到后端处理，这里只是标记
                return false;
            default:
                return false;
        }
    }

    /**
     * 处理时间查询
     */
    async function handleTimeQuery(message, onChunk) {
        const timeResponse = window.TimeHelper.getTimeResponse(message);
        await streamResponse(timeResponse, onChunk);
    }

    /**
     * 处理天气查询
     */
    async function handleWeatherQuery(message, onChunk) {
        try {
            // 提取城市名称
            let city = 'Beijing'; // 默认城市
            const cityMatch = message.match(/(.+?)(天气|weather)/i);
            if (cityMatch) {
                city = cityMatch[1].trim();
                // 简单的城市映射
                const cityMap = {
                    '北京': 'Beijing',
                    '上海': 'Shanghai',
                    '广州': 'Guangzhou',
                    '深圳': 'Shenzhen',
                    '杭州': 'Hangzhou',
                    '成都': 'Chengdu',
                    '重庆': 'Chongqing',
                    '武汉': 'Wuhan',
                    '南京': 'Nanjing',
                    '天津': 'Tianjin',
                    'New York': 'New_York',
                    'London': 'London',
                    'Tokyo': 'Tokyo',
                    'Paris': 'Paris'
                };
                if (cityMap[city]) {
                    city = cityMap[city];
                }
            }

            // 调用 wttr.in API
            const weatherUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`;
            const response = await fetch(weatherUrl);
            const data = await response.json();

            // 解析天气数据
            const current = data.current_condition[0];
            const forecast = data.weather[0];

            const weatherText = `📍 **${city} 实时天气**

🌡️ 温度：${current.temp_C}°C (体感 ${current.FeelsLikeC}°C)
💨 风速：${current.windspeedKmph} km/h (${current.winddir16Point})
💧 湿度：${current.humidity}%
☁️ 天气：${current.lang_zh[0].value || current.weatherDesc[0].value}

**明日预报**
🌡️ 温度：${forecast.mintempC}°C - ${forecast.maxtempC}°C
☁️ 天气：${forecast.hourly[4].lang_zh[0].value || forecast.hourly[4].weatherDesc[0].value}`;

            await streamResponse(weatherText, onChunk);
        } catch (error) {
            await streamResponse(`抱歉，无法获取天气信息。错误：${error.message}\n\n请稍后再试，或尝试使用联网搜索功能。`, onChunk);
        }
    }

    /**
     * 处理汇率查询
     */
    async function handleExchangeQuery(message, onChunk) {
        try {
            // 默认查询美元、欧元、日元对人民币的汇率
            const exchangeUrl = 'https://api.exchangerate-api.com/v4/latest/CNY';
            const response = await fetch(exchangeUrl);
            const data = await response.json();

            const rates = data.rates;
            const date = data.date;

            const exchangeText = `📊 **汇率信息** (${date})

1 CNY (人民币) = 
- ${rates.USD.toFixed(4)} USD (美元)
- ${rates.EUR.toFixed(4)} EUR (欧元)
- ${rates.JPY.toFixed(2)} JPY (日元)
- ${rates.HKD.toFixed(4)} HKD (港币)

1 USD = ${(1 / rates.USD).toFixed(4)} CNY
1 EUR = ${(1 / rates.EUR).toFixed(4)} CNY
1 JPY = ${(1 / rates.JPY).toFixed(4)} CNY

💡 提示：实时汇率数据来自公开API，仅供参考。实际交易请以银行实时报价为准。`;

            await streamResponse(exchangeText, onChunk);
        } catch (error) {
            await streamResponse(`抱歉，无法获取汇率信息。错误：${error.message}\n\n请稍后再试，或尝试使用联网搜索功能。`, onChunk);
        }
    }

    /**
     * 流式输出响应
     */
    async function streamResponse(text, onChunk) {
        const chunks = text.split('');
        for (let i = 0; i < chunks.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 5)); // 模拟打字效果
            onChunk({ type: 'content', content: chunks.slice(0, i + 1).join('') });
        }
    }

    /**
     * 检查是否支持某个城市的天气查询
     */
    function getSupportedCities() {
        return [
            '北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '南京', '天津',
            'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou', 'Chengdu',
            'New York', 'London', 'Tokyo', 'Paris'
        ];
    }

    return {
        detectQueryType,
        handleRealTimeQuery,
        getSupportedCities
    };
})();
