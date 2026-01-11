/**
 * Конфигурация для Telegram Mini App
 * 
 * ВСЁ РАБОТАЕТ НА GITHUB!
 * Данные сохраняются в GitHub Gist и отправляются в Telegram
 */

const GITHUB_CONFIG = {
    // ⚠️ ВАЖНО: Создайте GitHub Personal Access Token:
    // 1. Перейдите: https://github.com/settings/tokens
    // 2. Нажмите "Generate new token (classic)"
    // 3. Выберите scope: "gist" (достаточно)
    // 4. Скопируйте токен и вставьте ниже
    token: '',  // ⚠️ ВСТАВЬТЕ ВАШ GITHUB TOKEN ЗДЕСЬ!
    
    // ID существующего Gist (опционально)
    // Если не указан, будет создан новый Gist
    // После первого создания Gist, скопируйте его ID сюда
    gistId: '',  // Например: 'abc123def456...'
    
    // Webhook для отправки уведомлений в Telegram (опционально)
    // Можно использовать GitHub Actions или прямой вызов Telegram Bot API
    telegramWebhook: ''  // Например: 'https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>'
};

// Проверка конфигурации
if (!GITHUB_CONFIG.token) {
    console.warn('⚠️ ВНИМАНИЕ: GitHub токен не настроен!');
    console.warn('⚠️ Создайте токен на https://github.com/settings/tokens');
    console.warn('⚠️ И вставьте его в config.js в поле GITHUB_CONFIG.token');
} else {
    console.log('✅ Конфигурация GitHub загружена');
    if (GITHUB_CONFIG.gistId) {
        console.log('✅ Используется существующий Gist:', GITHUB_CONFIG.gistId);
    } else {
        console.log('ℹ️ Будет создан новый Gist при первой записи');
    }
}

