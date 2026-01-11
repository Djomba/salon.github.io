/**
 * Vercel Serverless Function для прямой отправки в Telegram
 * БЕЗ создания GitHub Issues
 * 
 * ИНСТРУКЦИЯ:
 * 1. Создайте папку api/ в корне проекта (на Vercel)
 * 2. Скопируйте этот файл в api/telegram-direct.js
 * 3. Добавьте переменные окружения в Vercel:
 *    - BOT_TOKEN = токен Telegram бота
 *    - CHAT_ID = ваш Chat ID
 * 4. Обновите booking.js для использования этого endpoint
 */

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  const { name, phone, service, datetime, comment } = req.body;

  // Валидация
  if (!name || !phone || !service || !datetime) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, phone, service, datetime'
    });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    console.error('BOT_TOKEN or CHAT_ID not configured');
    return res.status(500).json({
      success: false,
      error: 'Telegram credentials not configured. Please set BOT_TOKEN and CHAT_ID environment variables.'
    });
  }

  try {
    // Форматируем дату
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const weekday = weekdays[dateObj.getDay()];
    const formattedDate = `${day}.${month}.${year} (${weekday}) ${hours}:${minutes}`;

    // Формируем сообщение для Telegram
    let message = `🟣 НОВАЯ ЗАПИСЬ 🟣\n\n`;
    message += `👤 Имя: ${escapeHtml(name)}\n`;
    message += `📞 Телефон: ${phone}\n`;
    message += `💅 Услуга: ${escapeHtml(service)}\n`;
    message += `📅 Дата и время: ${formattedDate}\n`;
    
    if (comment) {
      message += `\n💬 Комментарий:\n${escapeHtml(comment)}\n`;
    }

    // Отправляем в Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    };

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.description || `Telegram API error: ${response.status} ${response.statusText}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Запись успешно отправлена в Telegram!'
    });

  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

