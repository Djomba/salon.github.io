/**
 * Альтернативная функция для прямой отправки в Telegram
 * БЕЗ создания GitHub Issues
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * Замените функцию createGitHubIssue() в script.js на эту функцию
 * И настройте VERCEL_API_URL на ваш Vercel endpoint
 */

// URL вашего Vercel Function (замените на ваш)
const VERCEL_API_URL = 'https://ваш-проект.vercel.app/api/telegram-direct';

async function sendToTelegramDirect(formData) {
    console.log('📤 Отправка данных напрямую в Telegram...', formData);
    
    try {
        // Отправляем данные в Vercel Function
        const response = await fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка! статус: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Ответ от сервера:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
        return {
            success: false,
            message: 'Ошибка соединения: ' + error.message
        };
    }
}

// Использование в форме:
// Замените в script.js:
// const result = await createGitHubIssue(formData);
// на:
// const result = await sendToTelegramDirect(formData);

