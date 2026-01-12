// Модуль для отправки уведомлений в Telegram
// Используется для избежания циклических зависимостей

let botInstance = null;

function setBot(bot) {
    botInstance = bot;
}

async function notifyAdmins(message, bookingId) {
    if (!botInstance) {
        console.log('Бот не инициализирован, уведомление не отправлено');
        return;
    }
    
    const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    
    for (const adminId of ADMIN_IDS) {
        try {
            await botInstance.sendMessage(adminId, message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✏️ Редактировать', callback_data: `edit_${bookingId}` }
                    ]]
                }
            });
        } catch (error) {
            console.error(`Ошибка отправки админу ${adminId}:`, error);
        }
    }
}

module.exports = { setBot, notifyAdmins };
