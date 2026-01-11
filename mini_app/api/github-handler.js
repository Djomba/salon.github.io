/**
 * GitHub Gists API Handler для Mini App
 * 
 * Сохраняет данные в GitHub Gist и отправляет уведомление в Telegram
 * Всё работает на GitHub без дополнительных серверов!
 */

// Эта функция будет вызываться из script.js
async function saveToGitHubGist(data) {
    const GITHUB_TOKEN = GITHUB_CONFIG?.token;
    const GIST_ID = GITHUB_CONFIG?.gistId;
    
    if (!GITHUB_TOKEN) {
        throw new Error('GitHub токен не настроен. См. инструкцию в README.md');
    }
    
    try {
        // Форматируем дату
        const dateObj = new Date(data.datetime);
        const formattedDate = formatDateTime(dateObj);
        
        // Формируем содержимое записи
        let content = `# 📋 Запись на ${formattedDate}\n\n`;
        content += `**👤 Имя:** ${data.name}\n`;
        content += `**📞 Телефон:** ${data.phone}\n`;
        content += `**💅 Услуга:** ${data.service}\n`;
        content += `**📅 Дата и время:** ${formattedDate}\n`;
        
        if (data.comment) {
            content += `\n**💬 Комментарий:**\n${data.comment}\n`;
        }
        
        if (data.user_id) {
            content += `\n**👤 Пользователь Telegram:**\n`;
            content += `- ID: ${data.user_id}\n`;
            if (data.username) {
                content += `- Username: @${data.username}\n`;
            }
        }
        
        content += `\n---\n*Создано: ${new Date().toLocaleString('ru-RU')}*\n`;
        
        // Получаем существующий Gist или создаем новый
        let gistData;
        let existingContent = '';
        
        if (GIST_ID) {
            // Обновляем существующий Gist
            try {
                const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const gist = await response.json();
                    const filename = Object.keys(gist.files)[0] || 'appointments.md';
                    existingContent = gist.files[filename]?.content || '';
                }
            } catch (e) {
                console.warn('Не удалось загрузить существующий Gist, создаем новый');
            }
        }
        
        // Получаем имя файла из существующего Gist или используем по умолчанию
        let filename = 'appointments.md';
        if (GIST_ID) {
            try {
                const gistResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (gistResponse.ok) {
                    const gist = await gistResponse.json();
                    const fileKeys = Object.keys(gist.files);
                    if (fileKeys.length > 0) {
                        filename = fileKeys[0];
                    }
                }
            } catch (e) {
                console.warn('Не удалось получить имя файла, используем по умолчанию');
            }
        }
        
        // Добавляем новую запись в начало файла
        const newContent = content + '\n\n' + existingContent;
        
        // Обновляем или создаем Gist
        const gistPayload = {
            description: `Записи салона красоты - ${new Date().toLocaleDateString('ru-RU')}`,
            public: false,
            files: {
                [filename]: {
                    content: newContent
                }
            }
        };
        
        const url = GIST_ID 
            ? `https://api.github.com/gists/${GIST_ID}`
            : 'https://api.github.com/gists';
        
        const method = GIST_ID ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistPayload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('✅ Запись сохранена в GitHub Gist:', result.html_url);
        
        // Отправляем уведомление в Telegram через GitHub API (если настроен webhook)
        // Или можно использовать прямой вызов Telegram Bot API
        if (GITHUB_CONFIG?.telegramWebhook) {
            try {
                await fetch(GITHUB_CONFIG.telegramWebhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: `🟣 НОВАЯ ЗАПИСЬ!\n\n👤 ${data.name}\n📞 ${data.phone}\n💅 ${data.service}\n📅 ${formattedDate}`
                    })
                });
            } catch (e) {
                console.warn('Не удалось отправить уведомление в Telegram');
            }
        }
        
        return {
            success: true,
            gistUrl: result.html_url,
            gistId: result.id
        };
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в GitHub Gist:', error);
        throw error;
    }
}

function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const weekday = weekdays[date.getDay()];
    
    return `${day}.${month}.${year} (${weekday}) ${hours}:${minutes}`;
}

