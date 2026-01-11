/**
 * Конфигурация для GitHub Issues API
 * 
 * ВАЖНО: Не храните токены в этом файле!
 * Используйте переменные окружения или прокси-сервер
 */

// Конфигурация Bot API
const BOT_API_CONFIG = {
    // URL вашего Bot API сервера
    // Замените на ваш URL (например: https://ваш-сервер.com или https://abc123.ngrok.io)
    apiUrl: 'https://ваш-сервер.com/api/appointment'
};

// Проверка конфигурации
if (GITHUB_CONFIG.owner === 'YOUR_GITHUB_USERNAME' || GITHUB_CONFIG.repo === 'YOUR_REPO_NAME') {
    console.warn('⚠️ ВНИМАНИЕ: Необходимо настроить GITHUB_CONFIG в config.js');
}

