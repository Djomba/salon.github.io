const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
const { setBot, notifyAdmins } = require('./notify');

// Вспомогательная функция для чтения JSON
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');

// Создание бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Проверка админа
function isAdmin(userId) {
    return ADMIN_IDS.includes(String(userId));
}

// Чтение записей из файла
async function readBookings() {
    try {
        const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Сохранение записей в файл
async function saveBookings(bookings) {
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = isAdmin(chatId);
    
    let text = '👋 Добро пожаловать в бот маникюрного салона!\n\n';
    
    if (isAdminUser) {
        text += '🔐 Вы администратор\n\n';
        text += 'Доступные команды:\n';
        text += '/bookings - Просмотр всех записей\n';
        text += '/excel - Скачать Excel файл с записями\n';
        text += '/edit <ID> - Редактировать запись\n';
    } else {
        text += 'Используйте Mini App для записи на маникюр!';
    }
    
    bot.sendMessage(chatId, text);
});

// Обработка данных из Mini App
bot.on('message', async (msg) => {
    // Проверяем, есть ли данные от WebApp
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            
            if (data.type === 'booking') {
                await handleBookingData(msg, data);
            }
        } catch (error) {
            console.error('Ошибка обработки данных WebApp:', error);
        }
    }
    
    // Также обрабатываем текстовые сообщения с данными (fallback)
    if (msg.text && msg.text.startsWith('BOOKING_DATA:')) {
        try {
            const jsonData = msg.text.replace('BOOKING_DATA:', '');
            const data = JSON.parse(jsonData);
            if (data.type === 'booking') {
                await handleBookingData(msg, data);
            }
        } catch (error) {
            console.error('Ошибка обработки текстовых данных:', error);
        }
    }
});

// Обработка данных записи
async function handleBookingData(msg, data) {
    const chatId = msg.chat.id;
    const bookingData = data.data;
    
    // Получаем название услуги
    let serviceName = bookingData.serviceId;
    try {
        const services = await readJSON(path.join(__dirname, 'data', 'services.json'));
        const service = services.find(s => s.id === bookingData.serviceId);
        if (service) {
            serviceName = service.name;
        }
    } catch (error) {
        console.error('Ошибка загрузки услуги:', error);
    }
    
    // Формируем сообщение для админов
    const adminMessage = `
📅 Новая запись!

👤 Имя: ${bookingData.name}
📞 Телефон: ${bookingData.phone}
💅 Услуга: ${serviceName}
📆 Дата: ${bookingData.date}
⏰ Время: ${bookingData.time}
${bookingData.comment ? `💬 Комментарий: ${bookingData.comment}` : ''}

ID записи: ${data.bookingId}
ID пользователя: ${bookingData.userId || 'Не указан'}
Username: @${bookingData.username || 'Не указан'}
`;
    
    // Отправляем сообщение всем админам
    for (const adminId of ADMIN_IDS) {
        try {
            await bot.sendMessage(adminId, adminMessage, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✏️ Редактировать', callback_data: `edit_${data.bookingId}` }
                    ]]
                }
            });
        } catch (error) {
            console.error(`Ошибка отправки сообщения админу ${adminId}:`, error);
        }
    }
    
    // Подтверждение пользователю
    try {
        await bot.sendMessage(chatId, '✅ Ваша запись принята! Мы свяжемся с вами для подтверждения.');
    } catch (error) {
        console.error('Ошибка отправки подтверждения:', error);
    }
}

// Команда просмотра записей (только для админов)
bot.onText(/\/bookings/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    
    try {
        const bookings = await readBookings();
        
        if (bookings.length === 0) {
            return bot.sendMessage(chatId, '📝 Записей пока нет.');
        }
        
        // Показываем последние 10 записей
        const recentBookings = bookings.slice(-10).reverse();
        
        let message = '📋 Последние записи:\n\n';
        
        recentBookings.forEach((booking, index) => {
            message += `${index + 1}. ${booking.name} - ${booking.date} ${booking.time}\n`;
            message += `   📞 ${booking.phone}\n`;
            if (booking.comment) {
                message += `   💬 ${booking.comment}\n`;
            }
            message += `   ID: ${booking.id}\n\n`;
        });
        
        bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Ошибка загрузки записей:', error);
        bot.sendMessage(chatId, '❌ Ошибка загрузки записей.');
    }
});

// Команда экспорта в Excel (только для админов)
bot.onText(/\/excel/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    
    try {
        const bookings = await readBookings();
        
        if (bookings.length === 0) {
            return bot.sendMessage(chatId, '📝 Записей нет для экспорта.');
        }
        
        // Формируем Excel файл (упрощенная версия - можно использовать библиотеку)
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Записи');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Дата', key: 'date', width: 15 },
            { header: 'Время', key: 'time', width: 10 },
            { header: 'Имя', key: 'name', width: 20 },
            { header: 'Телефон', key: 'phone', width: 15 },
            { header: 'Комментарий', key: 'comment', width: 40 }
        ];
        
        bookings.forEach(booking => {
            worksheet.addRow({
                id: booking.id,
                date: booking.date,
                time: booking.time,
                name: booking.name,
                phone: booking.phone,
                comment: booking.comment || ''
            });
        });
        
        worksheet.getRow(1).font = { bold: true };
        
        const filePath = path.join(__dirname, 'temp', 'bookings.xlsx');
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await workbook.xlsx.writeFile(filePath);
        
        await bot.sendDocument(chatId, filePath, {
            caption: '📊 Excel файл со всеми записями'
        });
        
        // Удаляем временный файл
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Ошибка экспорта в Excel:', error);
        bot.sendMessage(chatId, '❌ Ошибка создания Excel файла.');
    }
});

// Редактирование записи
bot.onText(/\/edit (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const bookingId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    
    try {
        const bookings = await readBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            return bot.sendMessage(chatId, '❌ Запись не найдена.');
        }
        
        const message = `
📝 Редактирование записи:

Текущие данные:
👤 Имя: ${booking.name}
📞 Телефон: ${booking.phone}
📆 Дата: ${booking.date}
⏰ Время: ${booking.time}
💬 Комментарий: ${booking.comment || 'Нет'}

Отправьте новые данные в формате:
/editdata ${bookingId}
Имя|Телефон|Дата|Время|Комментарий
        `;
        
        bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Ошибка загрузки записи:', error);
        bot.sendMessage(chatId, '❌ Ошибка загрузки записи.');
    }
});

// Обработка callback для редактирования
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (!isAdmin(chatId)) {
        return bot.answerCallbackQuery(query.id, { text: '❌ Нет доступа' });
    }
    
    if (data.startsWith('edit_')) {
        const bookingId = data.replace('edit_', '');
        
        try {
            const bookings = await readBookings();
            const booking = bookings.find(b => b.id === bookingId);
            
            if (!booking) {
                return bot.answerCallbackQuery(query.id, { text: '❌ Запись не найдена' });
            }
            
            const message = `
📝 Редактирование записи ID: ${bookingId}

Текущие данные:
👤 Имя: ${booking.name}
📞 Телефон: ${booking.phone}
📆 Дата: ${booking.date}
⏰ Время: ${booking.time}
💬 Комментарий: ${booking.comment || 'Нет'}

Используйте команду:
/editdata ${bookingId}
НовоеИмя|НовыйТелефон|НоваяДата|НовоеВремя|НовыйКомментарий
            `;
            
            bot.sendMessage(chatId, message);
            bot.answerCallbackQuery(query.id, { text: '✅ Откройте сообщение для инструкций' });
        } catch (error) {
            console.error('Ошибка:', error);
            bot.answerCallbackQuery(query.id, { text: '❌ Ошибка' });
        }
    }
});

// Команда редактирования данных
bot.onText(/\/editdata (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    
    const parts = match[1].split('|');
    if (parts.length < 5) {
        return bot.sendMessage(chatId, '❌ Неверный формат. Используйте:\n/editdata ID|Имя|Телефон|Дата|Время|Комментарий');
    }
    
    const [bookingId, name, phone, date, time, comment] = parts;
    
    try {
        const bookings = await readBookings();
        const index = bookings.findIndex(b => b.id === bookingId);
        
        if (index === -1) {
            return bot.sendMessage(chatId, '❌ Запись не найдена.');
        }
        
        bookings[index] = {
            ...bookings[index],
            name: name.trim(),
            phone: phone.trim(),
            date: date.trim(),
            time: time.trim(),
            comment: comment.trim(),
            updatedAt: new Date().toISOString(),
            updatedBy: chatId
        };
        
        await saveBookings(bookings);
        
        bot.sendMessage(chatId, '✅ Запись успешно обновлена!');
    } catch (error) {
        console.error('Ошибка обновления записи:', error);
        bot.sendMessage(chatId, '❌ Ошибка обновления записи.');
    }
});

// Инициализируем модуль уведомлений
setBot(bot);

console.log('🤖 Telegram бот запущен!');

module.exports = bot;
