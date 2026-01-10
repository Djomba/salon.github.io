// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем данные пользователя из Telegram
const user = tg.initDataUnsafe?.user || {};
const userId = user.id || null;
const userName = user.first_name || 'Гость';
const userLastName = user.last_name || '';
const userUsername = user.username || '';

// Функция переключения экранов
function showScreen(screenName) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем выбранный экран
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        // Если экран не найден, показываем главный
        document.getElementById('homeScreen').classList.add('active');
    }
}

// Обработка кликов по пунктам меню
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const screen = this.getAttribute('data-screen');
        showScreen(screen);
    });
});

// Загрузка данных профиля
function loadProfile() {
    const profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.innerHTML = `
            <h3 style="font-size: 24px; margin-bottom: 10px; color: var(--text-primary);">${userName} ${userLastName}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 5px;">@${userUsername || 'не указан'}</p>
            <p style="color: var(--text-secondary);">ID: ${userId || 'не определен'}</p>
        `;
    }
}

// Показ моих записей
function showMyAppointments() {
    tg.showAlert('Функция "Мои записи" будет доступна после записи. Используйте команду /my_appointments в боте.');
}

// Открытие карты
function openMap() {
    const address = 'г. Москва, ул. Примерная, д. 123';
    const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    window.open(mapUrl, '_blank');
}

// Звонок по телефону
function callPhone(phone) {
    window.location.href = `tel:${phone}`;
}

// Открытие Telegram
function openTelegram(username) {
    const tgUrl = `https://t.me/${username.replace('@', '')}`;
    window.open(tgUrl, '_blank');
}

// Инициализация формы записи
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Обработка отправки формы
const form = document.getElementById('appointmentForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

if (form) {
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
        
        // Валидация телефона
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(formData.phone)) {
            tg.showAlert('Пожалуйста, введите корректный номер телефона');
            return;
        }
        
        // Отключаем кнопку отправки
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }
        
        try {
            // Отправляем данные в бот через Telegram Web App API
            tg.sendData(JSON.stringify(formData));
            
            // Показываем сообщение об успехе
            form.style.display = 'none';
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            
            // Закрываем Mini App через 2 секунды
            setTimeout(() => {
                tg.close();
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка отправки данных:', error);
            tg.showAlert('Произошла ошибка. Попробуйте позже.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '📅 Записаться';
            }
        }
    });
}

// Форматирование телефона
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0 && value[0] !== '7' && value[0] !== '8') {
            value = '7' + value;
        }
        if (value.length > 0 && !value.startsWith('+')) {
            value = '+' + value;
        }
        // Простое форматирование
        if (value.length > 1) {
            let formatted = value.substring(0, 2);
            if (value.length > 2) {
                formatted += ' (' + value.substring(2, 5);
            }
            if (value.length > 5) {
                formatted += ') ' + value.substring(5, 8);
            }
            if (value.length > 8) {
                formatted += '-' + value.substring(8, 10);
            }
            if (value.length > 10) {
                formatted += '-' + value.substring(10, 12);
            }
            e.target.value = formatted;
        }
    });
}

// Загружаем профиль при открытии экрана профиля
const profileScreen = document.getElementById('profileScreen');
if (profileScreen) {
    const observer = new MutationObserver((mutations) => {
        if (profileScreen.classList.contains('active')) {
            loadProfile();
        }
    });
    observer.observe(profileScreen, { attributes: true, attributeFilter: ['class'] });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Показываем главный экран
    showScreen('home');
    
    // Загружаем профиль если нужно
    if (document.getElementById('profileScreen').classList.contains('active')) {
        loadProfile();
    }
});
