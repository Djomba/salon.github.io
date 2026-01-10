// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Устанавливаем минимальную дату (сегодня)
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

// Обработка отправки формы
const form = document.getElementById('appointmentForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Получаем данные формы
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value
    };
    
    // Валидация
    if (!formData.name || !formData.phone || !formData.service || !formData.date || !formData.time) {
        tg.showAlert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Валидация телефона (простая проверка)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
        tg.showAlert('Пожалуйста, введите корректный номер телефона');
        return;
    }
    
    // Отключаем кнопку отправки
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    try {
        // Отправляем данные в бот через Telegram Web App API
        tg.sendData(JSON.stringify(formData));
        
        // Показываем сообщение об успехе
        form.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Закрываем Mini App через 2 секунды
        setTimeout(() => {
            tg.close();
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
        tg.showAlert('Произошла ошибка. Попробуйте позже.');
        submitBtn.disabled = false;
        submitBtn.textContent = '📅 Записаться';
    }
});

// Обработка данных от бота (если нужно)
tg.onEvent('mainButtonClicked', () => {
    tg.sendData(JSON.stringify({action: 'mainButton'}));
});

// Форматирование телефона (опционально)
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && value[0] !== '7' && value[0] !== '8') {
        value = '7' + value;
    }
    if (value.length > 0) {
        value = '+' + value;
    }
    // Можно добавить форматирование, но для простоты оставим как есть
});

