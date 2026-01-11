/**
 * Конфигурация для GitHub Issues API
 * 
 * ВАЖНО: Не храните токены в этом файле!
 * Используйте переменные окружения или прокси-сервер
 */

// Замените на ваши значения
const GITHUB_CONFIG = {
    // Владелец репозитория (ваш username на GitHub)
    owner: 'Djomba',
    
    // Название репозитория
    repo: 'salon.github.io',
    
    // Personal Access Token (НЕ храните здесь в продакшене!)
    // Для продакшена используйте прокси-сервер или переменные окружения
    token: '' // Будет установлен через переменные окружения или прокси
};

// Проверка конфигурации
if (GITHUB_CONFIG.owner === 'YOUR_GITHUB_USERNAME' || GITHUB_CONFIG.repo === 'YOUR_REPO_NAME') {
    console.warn('⚠️ ВНИМАНИЕ: Необходимо настроить GITHUB_CONFIG в config.js');
}

