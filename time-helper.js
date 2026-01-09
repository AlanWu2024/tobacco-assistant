/**
 * 时间查询辅助工具
 * 支持多种时间格式的识别和查询
 */
window.TimeHelper = (function() {
    /**
     * 判断是否为时间查询
     * @param {string} message 用户消息
     * @returns {boolean}
     */
    function isTimeQuery(message) {
        const timeKeywords = [
            '时间', '几点', '几点了', '现在', '当前时间', 'date', 'time',
            '今天', '明天', '昨天', '星期', '周几', '月份', '年月日',
            '几点钟', '什么时候', '现在几点', '现在什么时候'
        ];
        const lowerMessage = message.toLowerCase();
        return timeKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    /**
     * 获取时间响应
     * @param {string} message 用户消息
     * @returns {string}
     */
    function getTimeResponse(message) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];

        // 检查是否需要英文格式
        if (/^(date|time|what time|current time|what is the time)/i.test(message.toLowerCase())) {
            return getEnglishTimeResponse(now, weekday);
        }

        let response = `当前时间是：${year}年${month}月${day}日 ${weekday} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // 根据关键词提供更多信息
        if (message.includes('今天')) {
            response += `\n\n今天是 ${year}年${month}月${day}日，${weekday}`;
        } else if (message.includes('明天')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tMonth = tomorrow.getMonth() + 1;
            const tDay = tomorrow.getDate();
            const tWeekday = weekdays[tomorrow.getDay()];
            response += `\n\n明天是 ${year}年${tMonth}月${tDay}日，${tWeekday}`;
        } else if (message.includes('昨天')) {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yMonth = yesterday.getMonth() + 1;
            const yDay = yesterday.getDate();
            const yWeekday = weekdays[yesterday.getDay()];
            response += `\n\n昨天是 ${year}年${yMonth}月${yDay}日，${yWeekday}`;
        }

        return response;
    }

    /**
     * 获取英文时间响应
     * @param {Date} date 日期对象
     * @param {string} weekday 星期
     * @returns {string}
     */
    function getEnglishTimeResponse(date, weekday) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `Current time: ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${weekdays[date.getDay()]}) ${displayHours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    }

    /**
     * 获取时区时间
     * @param {string} timezone 时区（如 'Asia/Shanghai', 'America/New_York'）
     * @returns {string}
     */
    function getTimeByTimezone(timezone) {
        try {
            const options = {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                weekday: 'long'
            };
            const formatter = new Intl.DateTimeFormat('zh-CN', options);
            return formatter.format(new Date());
        } catch (error) {
            return `无法获取时区 ${timezone} 的时间`;
        }
    }

    /**
     * 获取当前时间戳
     * @returns {number}
     */
    function getTimestamp() {
        return Date.now();
    }

    /**
     * 获取当前时间的各种格式
     * @returns {object}
     */
    function getTimeFormats() {
        const now = new Date();
        return {
            timestamp: now.getTime(),
            isoString: now.toISOString(),
            localeString: now.toLocaleString('zh-CN'),
            date: now.toLocaleDateString('zh-CN'),
            time: now.toLocaleTimeString('zh-CN'),
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            minute: now.getMinutes(),
            second: now.getSeconds(),
            weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
        };
    }

    return {
        isTimeQuery,
        getTimeResponse,
        getTimeByTimezone,
        getTimestamp,
        getTimeFormats
    };
})();
